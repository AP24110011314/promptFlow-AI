from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "ingestion"  # 'ingestion', 'system', 'ml_retrain', 'export', 'alert'
    link_paper_id: Optional[int] = None

class NotificationCreate(NotificationBase):
    user_id: Optional[int] = None

class NotificationResponse(NotificationBase):
    id: int
    user_id: Optional[int] = None
    is_read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
