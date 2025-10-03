from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from routers.auth import get_current_user
from models import Commodity, Crop
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

# Pydantic Models
class CropCreate(BaseModel):
    name: str
    variety: Optional[str] = None
    planting_date: Optional[str] = None
    harvest_date: Optional[str] = None
    area: Optional[str] = None
    notes: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    location: Optional[str] = None
    zipcode: Optional[str] = None
    crop_type: Optional[str] = None
    growth_stage: Optional[str] = None
    soil_type: Optional[str] = None

class CropResponse(BaseModel):
    id: int
    name: str
    variety: Optional[str]
    planting_date: Optional[datetime]
    harvest_date: Optional[str]
    area: Optional[str]
    notes: Optional[str]
    state: Optional[str]
    district: Optional[str]
    location: Optional[str]
    zipcode: Optional[str]
    created_at: datetime
    crop_type: Optional[str] = None
    growth_stage: Optional[str] = None
    soil_type: Optional[str] = None
    
    class Config:
        from_attributes = True

@router.get("/commodities")
async def get_commodities(db: Session = Depends(get_db)):
    """Get commodities for dropdown (fast from database)"""
    commodities = db.query(Commodity).order_by(Commodity.name).all()
    
    if not commodities:
        # Fallback list if database is empty
        fallback = ["Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Potato", "Onion", "Tomato"]
        return {"commodities": fallback, "source": "fallback"}
    
    return {"commodities": [c.name for c in commodities], "source": "database"}

@router.post("/", response_model=CropResponse)
async def create_crop(
    crop: CropCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new crop"""
    # Convert planting_date string to datetime if provided
    planting_date = None
    if crop.planting_date:
        try:
            planting_date = datetime.fromisoformat(crop.planting_date.replace('Z', '+00:00'))
        except:
            planting_date = datetime.strptime(crop.planting_date, '%Y-%m-%d')
    
    db_crop = Crop(
        name=crop.name,
        variety=crop.variety,
        planting_date=planting_date,
        harvest_date=crop.harvest_date,
        area=crop.area,
        notes=crop.notes,
        state=crop.state,
        district=crop.district,
        location=crop.location,
        zipcode=crop.zipcode,
        crop_type=crop.crop_type,
        growth_stage=crop.growth_stage,
        soil_type=crop.soil_type,
        user_id=current_user.id
    )
    
    db.add(db_crop)
    db.commit()
    db.refresh(db_crop)
    
    return db_crop

@router.get("/", response_model=List[CropResponse])
async def get_crops(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's crops"""
    crops = db.query(Crop).filter(Crop.user_id == current_user.id).order_by(Crop.created_at.desc()).all()
    return crops

@router.get("/{crop_id}", response_model=CropResponse)
async def get_crop(
    crop_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific crop"""
    crop = db.query(Crop).filter(Crop.id == crop_id, Crop.user_id == current_user.id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    return crop

@router.put("/{crop_id}", response_model=CropResponse)
async def update_crop(
    crop_id: int,
    crop_update: CropCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update crop"""
    crop = db.query(Crop).filter(Crop.id == crop_id, Crop.user_id == current_user.id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    # Convert planting_date string to datetime if provided
    planting_date = None
    if crop_update.planting_date:
        try:
            planting_date = datetime.fromisoformat(crop_update.planting_date.replace('Z', '+00:00'))
        except:
            planting_date = datetime.strptime(crop_update.planting_date, '%Y-%m-%d')
    
    crop.name = crop_update.name
    crop.variety = crop_update.variety
    crop.planting_date = planting_date
    crop.harvest_date = crop_update.harvest_date
    crop.area = crop_update.area
    crop.notes = crop_update.notes
    crop.state = crop_update.state
    crop.district = crop_update.district
    crop.location = crop_update.location
    crop.zipcode = crop_update.zipcode
    crop.crop_type = crop_update.crop_type
    crop.growth_stage = crop_update.growth_stage
    crop.soil_type = crop_update.soil_type
    
    db.commit()
    db.refresh(crop)
    return crop

@router.delete("/{crop_id}")
async def delete_crop(
    crop_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete crop and all related data"""
    from models import ActivityLog, DiseaseDetection, WeatherAlert, CropConversation, CropCost
    
    crop = db.query(Crop).filter(Crop.id == crop_id, Crop.user_id == current_user.id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    try:
        # Delete all related data first
        db.query(ActivityLog).filter(ActivityLog.crop_id == crop_id).delete()
        db.query(DiseaseDetection).filter(DiseaseDetection.crop_id == crop_id).delete()
        db.query(WeatherAlert).filter(WeatherAlert.crop_id == crop_id).delete()
        db.query(CropConversation).filter(CropConversation.crop_id == crop_id).delete()
        db.query(CropCost).filter(CropCost.crop_id == crop_id).delete()
        
        # Now delete the crop
        db.delete(crop)
        db.commit()
        
        return {"message": "Crop and all related data deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting crop: {str(e)}")