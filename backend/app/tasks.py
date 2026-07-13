from app.celery_app import celery_app
from app.database import SessionLocal
from app.services.email_service import email_service
from app.services.alert_service import alert_service
from app.schemas.email import SimulateEmailRequest
import os

@celery_app.task(name="app.tasks.process_email_async")
def process_email_async(sender: str, subject: str, body: str, pdf_path: str = None):
    """Asynchronously processes an incoming email and extracts paper details."""
    db = SessionLocal()
    try:
        req = SimulateEmailRequest(
            sender=sender,
            subject=subject,
            body=body,
            department_hint="General"
        )
        print(f"Celery Task: Processing email from {sender} async...", flush=True)
        email_service.process_simulated_email(db, req, pdf_path=pdf_path)
    except Exception as e:
        print(f"Celery Task Error: {e}", flush=True)
    finally:
        db.close()

@celery_app.task(name="app.tasks.send_daily_digest_async")
def send_daily_digest_async():
    """Asynchronously sends the daily digest to faculty members."""
    db = SessionLocal()
    try:
        print("Celery Task: Generating and sending daily digests...", flush=True)
        alert_service.send_daily_digest(db)
    except Exception as e:
        print(f"Celery Task Error: {e}", flush=True)
    finally:
        db.close()
