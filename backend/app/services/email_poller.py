import imaplib
import email
from email.header import decode_header
import os
import time
import threading
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.email_service import email_service
from app.schemas.email import SimulateEmailRequest
from app.config import settings

class EmailPoller:
    def __init__(self):
        self.running = False
        self.thread = None

    def start(self):
        if settings.EMAIL_INTEGRATION_ENABLED and settings.EMAIL_POLLING_LIVE:
            if not self.running:
                self.running = True
                self.thread = threading.Thread(target=self._poll_loop, daemon=True)
                self.thread.start()
                print("Email Poller: Background live polling thread started.", flush=True)
        else:
            print("Email Poller: Background live polling is disabled via EMAIL_POLLING_LIVE.", flush=True)

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
            print("Email Poller: Background worker thread stopped.", flush=True)

    def _poll_loop(self):
        while self.running:
            try:
                self.poll_emails()
            except Exception as e:
                print(f"Email Poller Error: {e}", flush=True)
            
            # Wait for poll interval
            for _ in range(settings.EMAIL_POLL_INTERVAL):
                if not self.running:
                    break
                time.sleep(1)

    def decode_header_value(self, val):
        if not val:
            return ""
        decoded, encoding = decode_header(val)[0]
        if isinstance(decoded, bytes):
            try:
                return decoded.decode(encoding or 'utf-8', errors='ignore')
            except Exception:
                return decoded.decode('utf-8', errors='ignore')
        return str(decoded)

    def poll_emails(self):
        if not settings.EMAIL_USERNAME or not settings.EMAIL_PASSWORD:
            print("Email Poller: Missing credentials, skipping poll.", flush=True)
            return

        try:
            # Connect to IMAP server
            print(f"Email Poller: Connecting to {settings.EMAIL_IMAP_SERVER}...", flush=True)
            mail = imaplib.IMAP4_SSL(settings.EMAIL_IMAP_SERVER, settings.EMAIL_IMAP_PORT)
            mail.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)
            mail.select("inbox")
            print("Email Poller: Connected and authenticated successfully.", flush=True)

            # Search for messages with subject containing "published" that are UNSEEN
            status, messages = mail.search(None, 'UNSEEN', 'SUBJECT', 'published')
            if status != "OK":
                print("Email Poller: IMAP search failed.", flush=True)
                mail.logout()
                return

            mail_ids = messages[0].split()
            print(f"Email Poller: Found {len(mail_ids)} matching emails in inbox.", flush=True)
            if not mail_ids:
                mail.logout()
                return

            db: Session = SessionLocal()
            try:
                # Process newest emails first
                for mail_id in reversed(mail_ids):
                    # Fetch only the header first to check the subject quickly
                    status, data = mail.fetch(mail_id, "(RFC822.HEADER)")
                    if status != "OK":
                        continue

                    raw_header = data[0][1]
                    msg_hdr = email.message_from_bytes(raw_header)
                    subject = self.decode_header_value(msg_hdr.get("Subject"))
                    sender = self.decode_header_value(msg_hdr.get("From"))

                    print(f"Email Poller: Found target email - Subject: '{subject}' | From: '{sender}'", flush=True)

                    if "paper" not in subject.lower() or "published" not in subject.lower():
                        # Skip if it doesn't match our target keywords
                        continue

                    # Fetch the full email content
                    status, data = mail.fetch(mail_id, "(RFC822)")
                    if status != "OK":
                        continue

                    raw_email = data[0][1]
                    msg = email.message_from_bytes(raw_email)

                    # Extract body and attachments
                    body = ""
                    pdf_path = None

                    if msg.is_multipart():
                        for part in msg.walk():
                            content_type = part.get_content_type()
                            content_disposition = str(part.get("Content-Disposition"))

                            # Extract body
                            if content_type == "text/plain" and "attachment" not in content_disposition:
                                try:
                                    body += part.get_payload(decode=True).decode(part.get_content_charset() or 'utf-8', errors='ignore')
                                except Exception:
                                    pass
                            elif content_type == "text/html" and not body and "attachment" not in content_disposition:
                                try:
                                    html_body = part.get_payload(decode=True).decode(part.get_content_charset() or 'utf-8', errors='ignore')
                                    body += html_body
                                except Exception:
                                    pass
                            
                            # Extract attachment
                            if "attachment" in content_disposition:
                                filename = part.get_filename()
                                if filename:
                                    filename = self.decode_header_value(filename)
                                    if filename.lower().endswith(".pdf"):
                                        payload = part.get_payload(decode=True)
                                        
                                        # Ensure filename is unique or safe
                                        safe_filename = "".join([c for c in filename if c.isalnum() or c in ['.', '_', '-']]).strip()
                                        if not safe_filename:
                                            safe_filename = "attachment.pdf"
                                            
                                        dest_path = os.path.join(settings.STORAGE_DIR, safe_filename)
                                        if os.path.exists(dest_path):
                                            safe_filename = f"{int(time.time())}_{safe_filename}"
                                            dest_path = os.path.join(settings.STORAGE_DIR, safe_filename)
                                            
                                        with open(dest_path, "wb") as f:
                                            f.write(payload)
                                        pdf_path = dest_path
                                        print(f"Email Poller: Saved attachment to {pdf_path}", flush=True)
                    else:
                        content_type = msg.get_content_type()
                        if content_type == "text/plain":
                            body = msg.get_payload(decode=True).decode(msg.get_content_charset() or 'utf-8', errors='ignore')

                    print(f"Email Poller: Processing email - From: {sender}, Subject: {subject}", flush=True)

                    # Reconstruct SimulateEmailRequest
                    req = SimulateEmailRequest(
                        sender=sender,
                        subject=subject,
                        body=body or subject,
                        department_hint="General"
                    )

                    # Pass to Ingestion Pipeline
                    if settings.USE_CELERY:
                        try:
                            from app.tasks import process_email_async
                            process_email_async.delay(
                                sender=req.sender,
                                subject=req.subject,
                                body=req.body,
                                pdf_path=pdf_path
                            )
                            print("Email Poller: Dispatched email processing task to Celery async queue.", flush=True)
                        except Exception as cel_err:
                            print(f"Email Poller Celery dispatch error: {cel_err}. Falling back to sync.", flush=True)
                            email_service.process_simulated_email(db, req, pdf_path=pdf_path)
                    else:
                        email_service.process_simulated_email(db, req, pdf_path=pdf_path)

                    # Mark email as seen so we don't process it again
                    mail.store(mail_id, "+FLAGS", "\\Seen")

            finally:
                db.close()

            mail.close()
            mail.logout()

        except imaplib.IMAP4.error as imap_err:
            print(f"Email Poller IMAP connection error: {imap_err}", flush=True)
        except Exception as e:
            print(f"Email Poller processing error: {e}", flush=True)

email_poller = EmailPoller()
