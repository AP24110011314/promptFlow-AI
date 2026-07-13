from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.email_log import EmailIngestionLog
from app.schemas.email import SimulateEmailRequest, EmailLogResponse
from app.services.email_service import email_service
from app.core.security import get_current_user

router = APIRouter()

@router.post("/simulate", response_model=EmailLogResponse)
def simulate_incoming_email(
    req: SimulateEmailRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Triggers an incoming email event through the ML classification and PDF extraction pipeline."""
    log_entry = email_service.process_simulated_email(db, req)
    return log_entry

@router.get("/logs", response_model=List[EmailLogResponse])
def get_ingestion_logs(limit: int = 20, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(EmailIngestionLog).order_by(EmailIngestionLog.received_at.desc()).limit(limit).all()

@router.post("/sync")
def sync_emails(current_user = Depends(get_current_user)):
    """Manually triggers the IMAP poller to pull and process new unseen academic research emails."""
    from app.services.email_poller import email_poller
    try:
        email_poller.poll_emails()
        return {"status": "success", "message": "Manual email synchronization completed successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync emails: {str(e)}")
