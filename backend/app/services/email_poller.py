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
from html.parser import HTMLParser

class HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.ignore_tags = {"style", "script", "head", "title", "meta", "link"}
        self.current_tag = []

    def handle_starttag(self, tag, attrs):
        self.current_tag.append(tag.lower())

    def handle_endtag(self, tag):
        tag = tag.lower()
        if self.current_tag and self.current_tag[-1] == tag:
            self.current_tag.pop()

    def handle_data(self, data):
        if any(ignored in self.current_tag for ignored in self.ignore_tags):
            return
        self.text.append(data)

    def get_text(self):
        raw_text = "".join(self.text)
        lines = [line.strip() for line in raw_text.splitlines()]
        return "\n".join([line for line in lines if line])

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

    def clean_html_to_text(self, html_content):
        try:
            parser = HTMLTextExtractor()
            parser.feed(html_content)
            return parser.get_text()
        except Exception as e:
            print(f"Email Poller HTML clean error: {e}", flush=True)
            return html_content

    def format_imap_date(self, dt):
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return f"{dt.day}-{months[dt.month - 1]}-{dt.year}"

    def poll_emails(self):
        if not settings.EMAIL_USERNAME or not settings.EMAIL_PASSWORD:
            print("Email Poller: Missing credentials, skipping poll.", flush=True)
            return

        # Query the database for the latest email ingestion log date
        search_date = "15-Jul-2026"
        db_check: Session = SessionLocal()
        try:
            from app.models.email_log import EmailIngestionLog
            latest_log = db_check.query(EmailIngestionLog).order_by(EmailIngestionLog.received_at.desc()).first()
            if latest_log and latest_log.received_at:
                search_date = self.format_imap_date(latest_log.received_at)
        except Exception as db_err:
            print(f"Email Poller: Error checking latest sync time from DB: {db_err}", flush=True)
        finally:
            db_check.close()

        try:
            # Connect to IMAP server
            print(f"Email Poller: Connecting to {settings.EMAIL_IMAP_SERVER}...", flush=True)
            mail = imaplib.IMAP4_SSL(settings.EMAIL_IMAP_SERVER, settings.EMAIL_IMAP_PORT)
            mail.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)
            mail.select("inbox")
            print("Email Poller: Connected and authenticated successfully.", flush=True)

            # Search for messages since search_date with subject containing target keywords
            mail_ids = set()
            keywords_to_search = ["published", "paper", "research", "digest", "publication"]
            for keyword in keywords_to_search:
                try:
                    status, messages = mail.search(None, 'SINCE', search_date, 'SUBJECT', keyword)
                    if status == "OK" and messages[0]:
                        mail_ids.update(messages[0].split())
                except Exception as search_err:
                    print(f"Email Poller search error for '{keyword}' since {search_date}: {search_err}", flush=True)

            if not mail_ids:
                print(f"Email Poller: No matching emails found in inbox since {search_date}.", flush=True)
                mail.logout()
                return

            # Chronological sort (oldest to newest)
            mail_ids_list = sorted(list(mail_ids), key=lambda x: int(x))
            print(f"Email Poller: Found {len(mail_ids_list)} unique matching emails in inbox since {search_date}.", flush=True)

            db: Session = SessionLocal()
            try:
                # Process oldest emails first so that the sync progresses chronologically
                for mail_id in mail_ids_list:
                    # Fetch only the header first to check the subject quickly
                    status, data = mail.fetch(mail_id, "(RFC822.HEADER)")
                    if status != "OK":
                        continue

                    raw_header = data[0][1]
                    msg_hdr = email.message_from_bytes(raw_header)
                    subject = self.decode_header_value(msg_hdr.get("Subject"))
                    sender = self.decode_header_value(msg_hdr.get("From"))

                    print(f"Email Poller: Found target email - Subject: '{subject}' | From: '{sender}'", flush=True)

                    subject_lower = subject.lower()
                    allowed_keywords = ["paper", "published", "publish", "research", "digest", "publication"]
                    if not any(kw in subject_lower for kw in allowed_keywords):
                        # Skip if it doesn't match our target keywords
                        continue

                    # Deduplication check: only process if we don't already have a processed/rejected log for this sender & subject
                    from app.models.email_log import EmailIngestionLog
                    existing_log = db.query(EmailIngestionLog).filter(
                        EmailIngestionLog.sender == sender,
                        EmailIngestionLog.subject == subject
                    ).first()
                    if existing_log and existing_log.status in ["processed", "rejected_spam"]:
                        print(f"Email Poller: Skipping duplicate email - Subject: '{subject}' (already logged with status '{existing_log.status}')", flush=True)
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
                                    body += self.clean_html_to_text(html_body)
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
                        elif content_type == "text/html":
                            try:
                                html_body = msg.get_payload(decode=True).decode(msg.get_content_charset() or 'utf-8', errors='ignore')
                                body = self.clean_html_to_text(html_body)
                            except Exception:
                                pass

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
