from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import base64
from database import get_db
from models import User, Crop
from routers.auth import get_current_user
from ai.services.disease_ai_service import disease_ai_service

router = APIRouter()

@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify disease detection router is working"""
    return {"message": "Disease detection router is working", "status": "ok"}

class DiseaseAnalysisRequest(BaseModel):
    image_base64: str
    crop_id: int

class DiseaseAnalysisResponse(BaseModel):
    disease: str
    cause: str
    confidence: int
    severity: str
    precautions: list[str]
    treatment: list[str]

class DiseaseChatRequest(BaseModel):
    disease_name: str
    crop_id: int
    message: str

class DiseaseChatResponse(BaseModel):
    response: str

@router.post("/analyze", response_model=DiseaseAnalysisResponse)
async def analyze_disease(
    request: DiseaseAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze crop image for disease detection"""
    print(f"\n=== DISEASE ANALYSIS ENDPOINT CALLED ===")
    print(f"User: {current_user.email if current_user else 'None'}")
    print(f"Crop ID: {request.crop_id}")
    print(f"Image data length: {len(request.image_base64)}")
    print(f"Request received at /api/disease/analyze")
    
    try:
        # Verify user owns the crop
        crop = db.query(Crop).filter(
            Crop.id == request.crop_id,
            Crop.user_id == current_user.id
        ).first()
        
        if not crop:
            print(f"Crop not found for ID: {request.crop_id}")
            raise HTTPException(status_code=404, detail="Crop not found")
        
        print(f"Found crop: {crop.name}")
        print(f"Starting disease analysis...")
        
        # Analyze the image
        result = await disease_ai_service.analyze_disease_image(
            request.image_base64, 
            request.crop_id,
            db
        )
        
        print(f"Analysis completed successfully")
        print(f"Result: {result}")
        return DiseaseAnalysisResponse(**result)
        
    except Exception as e:
        print(f"Error in disease analysis: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to analyze image: {str(e)}")

@router.post("/chat", response_model=DiseaseChatResponse)
async def chat_about_disease(
    request: DiseaseChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat about a specific disease"""
    print(f"=== DISEASE CHAT ENDPOINT CALLED ===")
    print(f"User: {current_user.email}")
    print(f"Disease: {request.disease_name}")
    print(f"Message: {request.message}")
    
    try:
        # Verify user owns the crop
        crop = db.query(Crop).filter(
            Crop.id == request.crop_id,
            Crop.user_id == current_user.id
        ).first()
        
        if not crop:
            raise HTTPException(status_code=404, detail="Crop not found")
        
        # Get AI response about the disease
        response = await disease_ai_service.chat_about_disease(
            request.disease_name,
            request.crop_id,
            request.message,
            db
        )
        
        print(f"Chat response generated successfully")
        return DiseaseChatResponse(response=response)
        
    except Exception as e:
        print(f"Error in disease chat: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to get response: {str(e)}")