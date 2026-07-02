from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.core.security import get_current_admin_user
from app.ml_engine.classifier import ml_classifier

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    return db.query(User).order_by(User.id.asc()).all()

@router.post("/retrain-ml")
def trigger_ml_retrain(current_user: User = Depends(get_current_admin_user)):
    """Admin trigger to re-index and retrain scikit-learn models on updated data corpus."""
    ml_classifier.retrain_models()
    return {"status": "success", "message": "Scikit-learn classification models retrained successfully."}
