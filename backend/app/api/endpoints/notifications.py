from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationCreate, NotificationResponse
from app.core.security import get_optional_current_user


router = APIRouter()

@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    limit: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)

):
    """List persistent notifications for current user (or global system notifications if guest)."""
    user_id = current_user.id if current_user else None
    
    query = db.query(Notification).filter(
        or_(
            Notification.user_id == user_id,
            Notification.user_id.is_(None)
        )
    )
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
        
    return query.order_by(Notification.created_at.desc(), Notification.id.desc()).limit(limit).all()

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)

):
    """Mark a single notification as read."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.post("/mark-all-read")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)

):
    """Mark all unread notifications as read."""
    user_id = current_user.id if current_user else None
    db.query(Notification).filter(
        or_(
            Notification.user_id == user_id,
            Notification.user_id.is_(None)
        ),
        Notification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}

@router.post("", response_model=NotificationResponse)
def create_notification(
    notif_in: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)

):
    """Create a new user/system notification."""
    notif = Notification(
        user_id=notif_in.user_id,
        title=notif_in.title,
        message=notif_in.message,
        type=notif_in.type,
        link_paper_id=notif_in.link_paper_id,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)

):
    """Delete a notification."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif)
    db.commit()
    return {"message": "Notification deleted"}
