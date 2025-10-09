from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import base64
from database import get_db
from models import User, Crop, DiseaseDetection, DiseaseChatHistory
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
    detection_id: int

class DiseaseChatRequest(BaseModel):
    detection_id: int
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
        
        # Extract crop name before calling service
        crop_name = crop.name
        print(f"Found crop: {crop_name}")
        print(f"Starting disease analysis...")
        
        # Analyze the image
        result = await disease_ai_service.analyze_disease_image(
            request.image_base64, 
            request.crop_id,
            db
        )
        
        # Save to database
        detection = DiseaseDetection(
            crop_id=request.crop_id,
            disease_name=result.get('disease', 'Unknown'),
            confidence=float(result.get('confidence', 0)),
            severity=result.get('severity', 'Unknown'),
            recommendations=str(result.get('treatment', []))
        )
        db.add(detection)
        db.commit()
        db.refresh(detection)
        
        result['detection_id'] = detection.id
        return DiseaseAnalysisResponse(**result)
        
    except Exception as e:
        print(f"Error in disease analysis: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to analyze image: {str(e)}")

@router.get("/history/{crop_id}")
async def get_disease_history(
    crop_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get disease detection history for crop"""
    crop = db.query(Crop).filter(Crop.id == crop_id, Crop.user_id == current_user.id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    detections = db.query(DiseaseDetection).filter(DiseaseDetection.crop_id == crop_id).order_by(DiseaseDetection.detected_at.desc()).all()
    return {"detections": [{"id": d.id, "disease_name": d.disease_name, "confidence": d.confidence, "severity": d.severity, "detected_at": d.detected_at} for d in detections]}

@router.get("/chat-history/{detection_id}")
async def get_disease_chat_history(
    detection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chat history for specific detection"""
    detection = db.query(DiseaseDetection).join(Crop).filter(DiseaseDetection.id == detection_id, Crop.user_id == current_user.id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    
    chats = db.query(DiseaseChatHistory).filter(DiseaseChatHistory.detection_id == detection_id).order_by(DiseaseChatHistory.created_at.asc()).all()
    return {"chat_history": [{"message": c.message, "response": c.response, "created_at": c.created_at} for c in chats]}

@router.post("/chat", response_model=DiseaseChatResponse)
async def chat_about_disease(
    request: DiseaseChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat about specific disease detection"""
    detection = db.query(DiseaseDetection).join(Crop).filter(DiseaseDetection.id == request.detection_id, Crop.user_id == current_user.id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    
    # Extract values before calling service to avoid session issues
    disease_name = detection.disease_name
    crop_id = detection.crop_id
    
    response = await disease_ai_service.chat_about_disease(disease_name, request.detection_id, request.message, db)
    
    # Save chat
    chat = DiseaseChatHistory(detection_id=request.detection_id, message=request.message, response=response)
    db.add(chat)
    db.commit()
    
    return DiseaseChatResponse(response=response)

@router.delete("/detection/{detection_id}")
async def delete_disease_detection(
    detection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete disease detection and its chat history"""
    detection = db.query(DiseaseDetection).join(Crop).filter(DiseaseDetection.id == detection_id, Crop.user_id == current_user.id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    
    # Delete chat history first
    db.query(DiseaseChatHistory).filter(DiseaseChatHistory.detection_id == detection_id).delete()
    # Delete detection
    db.delete(detection)
    db.commit()
    
    return {"message": "Detection deleted successfully"}