from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from routers.auth import get_current_user
from models import CropCost, Crop
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class CostCreate(BaseModel):
    crop_id: int
    expense_type: str
    title: Optional[str] = None
    amount: float
    description: Optional[str] = None
    date: Optional[datetime] = None

class CostResponse(BaseModel):
    id: int
    crop_id: int
    expense_type: str
    title: Optional[str]
    amount: float
    description: Optional[str]
    date: datetime
    created_at: datetime

@router.post("/", response_model=CostResponse)
async def add_cost(
    cost: CostCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify crop belongs to user
    crop = db.query(Crop).filter(Crop.id == cost.crop_id, Crop.user_id == current_user.id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    db_cost = CropCost(
        crop_id=cost.crop_id,
        expense_type=cost.expense_type,
        title=cost.title,
        amount=cost.amount,
        description=cost.description,
        date=cost.date or datetime.utcnow()
    )
    
    db.add(db_cost)
    db.commit()
    db.refresh(db_cost)
    return db_cost

@router.get("/crop/{crop_id}", response_model=List[CostResponse])
async def get_crop_costs(
    crop_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify crop belongs to user
    crop = db.query(Crop).filter(Crop.id == crop_id, Crop.user_id == current_user.id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    costs = db.query(CropCost).filter(CropCost.crop_id == crop_id).order_by(CropCost.date.desc()).all()
    return costs

@router.get("/crop/{crop_id}/total")
async def get_crop_total_cost(
    crop_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify crop belongs to user
    crop = db.query(Crop).filter(Crop.id == crop_id, Crop.user_id == current_user.id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    total = db.query(func.sum(CropCost.amount)).filter(CropCost.crop_id == crop_id).scalar() or 0
    
    # Get breakdown by expense type
    breakdown = db.query(
        CropCost.expense_type,
        func.sum(CropCost.amount).label('total')
    ).filter(CropCost.crop_id == crop_id).group_by(CropCost.expense_type).all()
    
    return {
        "crop_id": crop_id,
        "crop_name": crop.name,
        "total_cost": float(total),
        "breakdown": {item.expense_type: float(item.total) for item in breakdown}
    }

@router.delete("/{cost_id}")
async def delete_cost(
    cost_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cost = db.query(CropCost).filter(CropCost.id == cost_id).first()
    if not cost:
        raise HTTPException(status_code=404, detail="Cost not found")
    
    # Verify crop belongs to user
    crop = db.query(Crop).filter(Crop.id == cost.crop_id, Crop.user_id == current_user.id).first()
    if not crop:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db.delete(cost)
    db.commit()
    return {"message": "Cost deleted"}