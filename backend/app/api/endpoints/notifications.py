from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.notification import Notification, UserNotificationRead
from app.models.user import User
from app.schemas.notification import NotificationCreate, NotificationResponse
from app.core.security import get_optional_current_user

router = APIRouter()

def _get_read_notification_ids(db: Session, user_id: Optional[int]) -> set:
    if not user_id:
        return set()
    rows = db.query(UserNotificationRead.notification_id).filter(
        UserNotificationRead.user_id == user_id
    ).all()
    return {r[0] for r in rows}

@router.get("/unread-count")
def get_unread_notification_count(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Return total exact count of unread notifications for current user without pagination limits."""
    user_id = current_user.id if current_user else None

    # Base query for eligible notifications
    base_query = db.query(Notification).filter(
        or_(
            Notification.user_id == user_id,
            Notification.user_id.is_(None)
        )
    )

    if user_id:
        read_ids = _get_read_notification_ids(db, user_id)
        all_eligible = base_query.all()
        unread_count = sum(1 for n in all_eligible if n.id not in read_ids)
    else:
        unread_count = base_query.filter(Notification.is_read == False).count()

    return {"unread_count": max(0, unread_count)}

@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    limit: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """List persistent notifications for current user with independent per-user read state."""
    user_id = current_user.id if current_user else None

    raw_notifs = db.query(Notification).filter(
        or_(
            Notification.user_id == user_id,
            Notification.user_id.is_(None)
        )
    ).order_by(Notification.created_at.desc(), Notification.id.desc()).all()

    read_ids = _get_read_notification_ids(db, user_id) if user_id else set()

    result = []
    for notif in raw_notifs:
        is_read = (notif.id in read_ids) if user_id else notif.is_read
        if unread_only and is_read:
            continue

        resp = NotificationResponse(
            id=notif.id,
            user_id=notif.user_id,
            title=notif.title,
            message=notif.message,
            type=notif.type,
            link_paper_id=notif.link_paper_id,
            is_read=is_read,
            created_at=notif.created_at
        )
        result.append(resp)
        if len(result) >= limit:
            break

    return result

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Mark a single notification as read independently for the current user."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    if current_user:
        existing = db.query(UserNotificationRead).filter(
            UserNotificationRead.user_id == current_user.id,
            UserNotificationRead.notification_id == notification_id
        ).first()
        if not existing:
            db.add(UserNotificationRead(user_id=current_user.id, notification_id=notification_id))
            db.commit()
    else:
        notif.is_read = True
        db.commit()

    return NotificationResponse(
        id=notif.id,
        user_id=notif.user_id,
        title=notif.title,
        message=notif.message,
        type=notif.type,
        link_paper_id=notif.link_paper_id,
        is_read=True,
        created_at=notif.created_at
    )

@router.post("/mark-all-read")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Mark all eligible notifications as read for current user."""
    user_id = current_user.id if current_user else None

    raw_notifs = db.query(Notification.id).filter(
        or_(
            Notification.user_id == user_id,
            Notification.user_id.is_(None)
        )
    ).all()

    if user_id:
        read_ids = _get_read_notification_ids(db, user_id)
        for row in raw_notifs:
            nid = row[0]
            if nid not in read_ids:
                db.add(UserNotificationRead(user_id=user_id, notification_id=nid))
        db.commit()
    else:
        db.query(Notification).filter(
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
    return NotificationResponse(
        id=notif.id,
        user_id=notif.user_id,
        title=notif.title,
        message=notif.message,
        type=notif.type,
        link_paper_id=notif.link_paper_id,
        is_read=False,
        created_at=notif.created_at
    )

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
