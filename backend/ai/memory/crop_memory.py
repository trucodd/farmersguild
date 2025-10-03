from langchain.schema import BaseMessage, HumanMessage, AIMessage
from langchain_core.chat_history import BaseChatMessageHistory
from sqlalchemy.orm import Session
from models import CropConversation
from typing import List
import json

class PostgreSQLChatMessageHistory(BaseChatMessageHistory):
    """Chat message history stored in PostgreSQL for specific crop"""
    
    def __init__(self, crop_id: int, db: Session):
        self.crop_id = crop_id
        self.db = db
    
    @property
    def messages(self) -> List[BaseMessage]:
        """Get all messages for this crop"""
        conversations = self.db.query(CropConversation)\
            .filter(CropConversation.crop_id == self.crop_id)\
            .order_by(CropConversation.created_at.asc())\
            .all()
        
        messages = []
        for conv in conversations:
            # Parse stored messages
            try:
                stored_messages = json.loads(conv.message) if conv.message.startswith('[') else [conv.message]
                stored_responses = json.loads(conv.response) if conv.response.startswith('[') else [conv.response]
                
                for msg in stored_messages:
                    messages.append(HumanMessage(content=msg))
                for resp in stored_responses:
                    messages.append(AIMessage(content=resp))
            except:
                # Fallback for simple string format
                messages.append(HumanMessage(content=conv.message))
                messages.append(AIMessage(content=conv.response))
        
        return messages
    
    def add_message(self, message: BaseMessage) -> None:
        """Add a message to the history"""
        # Messages are added in pairs (human + AI), so we store them when we get the AI response
        pass
    
    def add_user_message(self, message: str) -> None:
        """Add a user message"""
        self._pending_user_message = message
    
    def add_ai_message(self, message: str) -> None:
        """Add an AI message and save the conversation pair"""
        if hasattr(self, '_pending_user_message'):
            conversation = CropConversation(
                crop_id=self.crop_id,
                message=self._pending_user_message,
                response=message,
                context_used=""
            )
            self.db.add(conversation)
            self.db.commit()
            delattr(self, '_pending_user_message')
    
    def clear(self) -> None:
        """Clear all messages for this crop"""
        self.db.query(CropConversation)\
            .filter(CropConversation.crop_id == self.crop_id)\
            .delete()
        self.db.commit()