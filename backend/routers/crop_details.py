from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from routers.auth import get_current_user
from models import Crop
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

class CropDetailsUpdate(BaseModel):
    crop_type: Optional[str] = None
    variety: Optional[str] = None
    growth_stage: Optional[str] = None
    soil_type: Optional[str] = None
    planting_date: Optional[str] = None
    location: Optional[str] = None
    area: Optional[str] = None
    notes: Optional[str] = None

class CropDetailsResponse(BaseModel):
    id: int
    name: str
    crop_type: Optional[str]
    variety: Optional[str]
    growth_stage: Optional[str]
    soil_type: Optional[str]
    planting_date: Optional[datetime]
    location: Optional[str]
    area: Optional[str]
    notes: Optional[str]
    
    class Config:
        from_attributes = True

@router.get("/{crop_id}/details", response_model=CropDetailsResponse)
async def get_crop_details(
    crop_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed crop information for AI context"""
    crop = db.query(Crop).filter(Crop.id == crop_id, Crop.user_id == current_user.id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    return crop

@router.put("/{crop_id}/details", response_model=CropDetailsResponse)
async def update_crop_details(
    crop_id: int,
    details: CropDetailsUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update crop details for better AI context"""
    crop = db.query(Crop).filter(Crop.id == crop_id, Crop.user_id == current_user.id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    # Update fields if provided
    if details.crop_type is not None:
        crop.crop_type = details.crop_type
    if details.variety is not None:
        crop.variety = details.variety
    if details.growth_stage is not None:
        crop.growth_stage = details.growth_stage
    if details.soil_type is not None:
        crop.soil_type = details.soil_type
    if details.location is not None:
        crop.location = details.location
    if details.area is not None:
        crop.area = details.area
    if details.notes is not None:
        crop.notes = details.notes
    
    # Handle planting date
    if details.planting_date is not None:
        try:
            crop.planting_date = datetime.fromisoformat(details.planting_date.replace('Z', '+00:00'))
        except:
            crop.planting_date = datetime.strptime(details.planting_date, '%Y-%m-%d')
    
    db.commit()
    db.refresh(crop)
    return crop