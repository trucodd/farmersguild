from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
from models import User, Conversation, Message, Crop
from routers.users import get_current_user
from ai.services.crop_ai_service import crop_ai_service
from langchain_openai import ChatOpenAI
import os

router = APIRouter()

# OpenRouter configuration (OpenAI-compatible)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

class ChatMessage(BaseModel):
    content: str
    crop_id: Optional[int] = None

class MessageResponse(BaseModel):
    id: str
    content: str
    role: str
    created_at: str

class ConversationResponse(BaseModel):
    id: str
    title: str
    messages: List[MessageResponse]

async def get_embedding(text: str, model: str = "openai/text-embedding-ada-002") -> str:
    """Skip embedding for now"""
    return ""

async def get_ai_response(message: str, model: str = "x-ai/grok-2-1212") -> str:
    """Get AI response using LangChain with OpenRouter"""
    try:
        llm = ChatOpenAI(
            openai_api_key=OPENROUTER_API_KEY,
            openai_api_base=OPENROUTER_BASE_URL,
            model_name=model,
            max_tokens=500,
            temperature=0.7
        )
        
        system_message = "You are a helpful farming assistant AI. Provide practical, accurate advice about agriculture, farming techniques, crop management, and related topics."
        response = llm.invoke([{"role": "system", "content": system_message}, {"role": "user", "content": message}])
        return response.content
    except Exception as e:
        print(f"Error getting AI response: {e}")
        return "I'm sorry, I'm having trouble processing your request right now. Please try again later."

@router.post("/send", response_model=MessageResponse)
async def send_message(
    message: ChatMessage,
    conversation_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"\n=== CHAT ENDPOINT CALLED ===")
    print(f"Message: {message.content}")
    print(f"Crop ID: {message.crop_id}")
    print(f"User: {current_user.email}")
    print("=" * 30)
    # Always create new conversation for crop chat
    crop_name = "General Chat"
    if message.crop_id:
        crop = db.query(Crop).filter(Crop.id == message.crop_id, Crop.user_id == current_user.id).first()
        if crop:
            crop_name = f"{crop.name} Chat"
    
    conversation = Conversation(
        user_id=current_user.id,
        title=f"{crop_name} - {message.content[:30]}..." if len(message.content) > 30 else f"{crop_name} - {message.content}"
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    # Save user message
    user_message = Message(
        conversation_id=conversation.id,
        content=message.content,
        role="user",
        embedding=""
    )
    db.add(user_message)
    db.commit()

    # Always use crop-specific AI
    crop_id = message.crop_id
    
    # If no crop_id provided, use user's first crop
    if not crop_id:
        first_crop = db.query(Crop).filter(Crop.user_id == current_user.id).first()
        if first_crop:
            crop_id = first_crop.id
    
    if crop_id:
        # Verify user owns the crop
        crop = db.query(Crop).filter(Crop.id == crop_id, Crop.user_id == current_user.id).first()
        if crop:
            print(f"Using crop-specific AI for crop {crop_id}: {crop.name}")
            ai_response_text = await crop_ai_service.chat_with_crop(crop_id, message.content, db)
        else:
            ai_response_text = "I couldn't find that crop in your account."
    else:
        ai_response_text = "Please create a crop first to get personalized farming advice."
    
    # Save AI message
    ai_message = Message(
        conversation_id=conversation.id,
        content=ai_response_text,
        role="assistant",
        embedding=""
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)

    return MessageResponse(
        id=str(ai_message.id),
        content=ai_message.content,
        role=ai_message.role,
        created_at=ai_message.created_at.isoformat()
    )

@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversations = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).all()
    
    result = []
    for conv in conversations:
        messages = db.query(Message).filter(
            Message.conversation_id == conv.id
        ).order_by(Message.created_at).all()
        
        result.append(ConversationResponse(
            id=str(conv.id),
            title=conv.title,
            messages=[
                MessageResponse(
                    id=str(msg.id),
                    content=msg.content,
                    role=msg.role,
                    created_at=msg.created_at.isoformat()
                ) for msg in messages
            ]
        ))
    
    return result

@router.post("/general")
async def general_agriculture_chat(
    message: ChatMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """General agriculture AI chat - not crop specific"""
    try:
        if not OPENROUTER_API_KEY:
            return {"response": "I'm sorry, AI service is not configured. Please try again later."}
        
        llm = ChatOpenAI(
            openai_api_key=OPENROUTER_API_KEY,
            openai_api_base=OPENROUTER_BASE_URL,
            model_name="x-ai/grok-2-1212",
            max_tokens=500,
            temperature=0.7
        )
        
        system_message = "You are an expert agricultural advisor AI assistant. Provide helpful, accurate, and practical advice about farming, agriculture, crop management, livestock, soil health, pest control, weather patterns, market trends, and all aspects of agricultural practices. Be conversational and supportive."
        
        response = llm.invoke([
            {"role": "system", "content": system_message}, 
            {"role": "user", "content": message.content}
        ])
        
        return {"response": response.content}
    except Exception as e:
        print(f"Error in general agriculture chat: {e}")
        return {"response": "I'm having trouble processing your request right now. Please try again later."}

@router.post("/search")
async def semantic_search(
    query: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search messages using vector similarity"""
    query_embedding = await get_embedding(query)
    
    # This would use pgvector for similarity search in production
    # For now, return a simple response
    return {"message": "Semantic search functionality ready for pgvector integration"}