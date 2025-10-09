from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Crop, CropConversation, DiseaseDetection, ActivityLog, CropCost
from routers.auth import get_current_user

router = APIRouter()

@router.get("/chat-history/{crop_id}")
async def get_crop_chat_history(
    crop_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chat history for specific crop"""
    crop = db.query(Crop).filter(Crop.id == crop_id, Crop.user_id == current_user.id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    conversations = db.query(CropConversation).filter(CropConversation.crop_id == crop_id).order_by(CropConversation.created_at.asc()).all()
    return {"chat_history": [{"message": c.message, "response": c.response, "created_at": c.created_at} for c in conversations]}

@router.get("/activity-logs/{crop_id}")
async def get_crop_activity_logs(
    crop_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get activity logs for specific crop"""
    crop = db.query(Crop).filter(Crop.id == crop_id, Crop.user_id == current_user.id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    logs = db.query(ActivityLog).filter(ActivityLog.crop_id == crop_id).order_by(ActivityLog.performed_at.desc()).all()
    return {"activity_logs": [{"id": l.id, "activity_type": l.activity_type, "description": l.description, "notes": l.notes, "performed_at": l.performed_at} for l in logs]}

@router.get("/costs/{crop_id}")
async def get_crop_costs(
    crop_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get costs for specific crop"""
    crop = db.query(Crop).filter(Crop.id == crop_id, Crop.user_id == current_user.id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    costs = db.query(CropCost).filter(CropCost.crop_id == crop_id).order_by(CropCost.date.desc()).all()
    return {"costs": [{"id": c.id, "expense_type": c.expense_type, "title": c.title, "amount": c.amount, "description": c.description, "date": c.date} for c in costs]}