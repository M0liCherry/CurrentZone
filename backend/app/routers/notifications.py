from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import Notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class NotificationItem(BaseModel):
    id: int
    title: str
    description: str
    category: str
    time_label: str
    is_read: bool

@router.get("/", response_model=List[NotificationItem])
def get_notifications(db: Session = Depends(get_db)):
    """
    Returns user notifications matching SmartWatt 'Notifications.png' lock screen / alert tray.
    """
    notifs = db.query(Notification).filter(Notification.user_id == 1).order_by(Notification.id.desc()).all()
    return notifs

@router.post("/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    """
    Marks a notification as read.
    """
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"success": True}
