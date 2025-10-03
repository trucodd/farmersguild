from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from ai.services.crop_ai_service import crop_ai_service
from models import Crop

router = APIRouter(prefix="/api/crops", tags=["crop-ai"])

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    crop_name: str

@router.post("/{crop_id}/chat", response_model=ChatResponse)
async def chat_with_crop(
    crop_id: int,
    chat_message: ChatMessage,
    db: Session = Depends(get_db)
):
    """Chat with AI about a specific crop"""
    print(f"Received chat request for crop {crop_id}: {chat_message.message}")
    
    # Verify crop exists
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        print(f"Crop {crop_id} not found")
        raise HTTPException(status_code=404, detail="Crop not found")
    
    print(f"Found crop: {crop.name}")
    
    try:
        response = await crop_ai_service.chat_with_crop(
            crop_id=crop_id,
            message=chat_message.message,
            db=db
        )
        
        print(f"AI response generated: {response[:100]}...")
        
        return ChatResponse(
            response=response,
            crop_name=crop.name
        )
    
    except Exception as e:
        print(f"AI service error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@router.get("/{crop_id}/context")
async def get_crop_context(crop_id: int, db: Session = Depends(get_db)):
    """Get current context for a crop (for debugging)"""
    from ai.services.crop_context import CropContextService
    
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    context_service = CropContextService(db)
    context = context_service.get_crop_context(crop_id)
    formatted_context = context_service.format_context_for_ai(context)
    
    return {
        "crop_id": crop_id,
        "crop_name": crop.name,
        "context": formatted_context
    }