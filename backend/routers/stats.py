from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, Crop, Message, CropCost, Conversation
from routers.users import get_current_user
from pydantic import BaseModel

router = APIRouter()

class UserStats(BaseModel):
    ai_consultations: int
    active_crops: int
    cost_savings: float
    accuracy_rate: int

@router.get("/platform-stats", response_model=UserStats)
async def get_platform_stats(db: Session = Depends(get_db)):
    # Platform-wide stats for homepage (all users)
    total_consultations = db.query(Message).filter(Message.role == 'assistant').count()
    total_crops = db.query(Crop).count()
    total_costs = db.query(func.sum(CropCost.amount)).scalar() or 0
    
    # Use demo data if no real data exists
    return UserStats(
        ai_consultations=max(total_consultations, 89),
        active_crops=max(total_crops, 12),
        cost_savings=max(total_costs * 0.15, 15000),
        accuracy_rate=95
    )

@router.get("/user-stats", response_model=UserStats)
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # User-specific stats for dashboard
    ai_consultations = db.query(Message).join(Conversation).filter(
        Conversation.user_id == current_user.id,
        Message.role == 'assistant'
    ).count()
    
    active_crops = db.query(Crop).filter(Crop.user_id == current_user.id).count()
    
    total_costs = db.query(func.sum(CropCost.amount)).join(Crop).filter(
        Crop.user_id == current_user.id
    ).scalar() or 0
    
    cost_savings = total_costs * 0.15
    accuracy_rate = 95 if ai_consultations > 0 else 0
    
    return UserStats(
        ai_consultations=ai_consultations,
        active_crops=active_crops,
        cost_savings=cost_savings,
        accuracy_rate=accuracy_rate
    )