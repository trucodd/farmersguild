from langchain.schema import BaseMessage, HumanMessage, AIMessage
from langchain_core.chat_history import BaseChatMessageHistory
from sqlalchemy.orm import Session
from models import DiseaseChatHistory
from typing import List

class DiseaseChatMessageHistory(BaseChatMessageHistory):
    """Chat message history for specific disease detection"""
    
    def __init__(self, detection_id: int, db: Session):
        self.detection_id = detection_id
        self.db = db
    
    @property
    def messages(self) -> List[BaseMessage]:
        """Get all messages for this disease detection"""
        chats = self.db.query(DiseaseChatHistory)\
            .filter(DiseaseChatHistory.detection_id == self.detection_id)\
            .order_by(DiseaseChatHistory.created_at.asc())\
            .all()
        
        messages = []
        for chat in chats:
            messages.append(HumanMessage(content=chat.message))
            messages.append(AIMessage(content=chat.response))
        
        return messages
    
    def add_message(self, message: BaseMessage) -> None:
        pass
    
    def add_user_message(self, message: str) -> None:
        self._pending_user_message = message
    
    def add_ai_message(self, message: str) -> None:
        if hasattr(self, '_pending_user_message'):
            chat = DiseaseChatHistory(
                detection_id=self.detection_id,
                message=self._pending_user_message,
                response=message
            )
            self.db.add(chat)
            self.db.commit()
            delattr(self, '_pending_user_message')
    
    def clear(self) -> None:
        self.db.query(DiseaseChatHistory)\
            .filter(DiseaseChatHistory.detection_id == self.detection_id)\
            .delete()
        self.db.commit()