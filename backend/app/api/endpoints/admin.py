from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.core.security import get_current_admin_user
from app.ml_engine.classifier import ml_classifier

from app.models.paper import ResearchPaper
from app.models.email_log import EmailIngestionLog

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    return db.query(User).order_by(User.id.asc()).all()

@router.post("/retrain-ml")
def trigger_ml_retrain(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    """Admin trigger to re-index and retrain scikit-learn models on updated data corpus."""
    # 1. Query all research papers to train department classifier
    papers = db.query(ResearchPaper).all()
    extra_texts = [f"{p.title} {p.abstract or ''}" for p in papers]
    extra_depts = [p.department for p in papers]

    # 2. Query email logs to train relevance classifier
    logs = db.query(EmailIngestionLog).all()
    extra_email_texts = []
    extra_email_classes = []
    for l in logs:
        if l.status in ["processed", "rejected_spam"]:
            text_sample = f"{l.subject} {l.body_snippet or ''}"
            cls = "research_paper" if l.status == "processed" else "general_email"
            extra_email_texts.append(text_sample)
            extra_email_classes.append(cls)

    # 3. Retrain scikit-learn models
    ml_classifier.retrain_models(
        extra_texts=extra_texts,
        extra_depts=extra_depts,
        extra_email_texts=extra_email_texts,
        extra_email_classes=extra_email_classes
    )
    return {"status": "success", "message": "Scikit-learn classification models retrained successfully on database corpus."}
