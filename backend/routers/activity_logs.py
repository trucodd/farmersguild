from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_db
from models import User, Crop, ActivityLog
from routers.auth import get_current_user

router = APIRouter()

class ActivityLogCreate(BaseModel):
    activity_type: str
    description: Optional[str] = None
    notes: Optional[str] = None

@router.post("/{crop_id}/activity")
async def add_activity_log(
    crop_id: int,
    activity_data: ActivityLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add activity log for specific crop"""
    crop = db.query(Crop).filter(Crop.id == crop_id, Crop.user_id == current_user.id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    activity = ActivityLog(
        crop_id=crop_id,
        activity_type=activity_data.activity_type,
        description=activity_data.description,
        notes=activity_data.notes,
        performed_at=datetime.utcnow()
    )
    
    db.add(activity)
    db.commit()
    db.refresh(activity)
    
    return {"id": activity.id, "activity_type": activity.activity_type, "description": activity.description, "notes": activity.notes, "performed_at": activity.performed_at}