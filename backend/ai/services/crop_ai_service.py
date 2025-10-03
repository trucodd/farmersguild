from typing import Dict
from sqlalchemy.orm import Session
from ..chains.crop_chat_chain import CropChatChain

class CropAIService:
    def __init__(self):
        self.active_chains: Dict[int, CropChatChain] = {}
    
    def get_crop_chain(self, crop_id: int, db: Session) -> CropChatChain:
        """Get or create crop-specific chat chain"""
        if crop_id not in self.active_chains:
            self.active_chains[crop_id] = CropChatChain(crop_id, db)
        return self.active_chains[crop_id]
    
    async def chat_with_crop(self, crop_id: int, message: str, db: Session) -> str:
        """Main method to chat with crop-specific AI"""
        chain = self.get_crop_chain(crop_id, db)
        return chain.get_response(message)
    
    def clear_crop_chain(self, crop_id: int):
        """Clear cached chain for crop (useful for memory management)"""
        if crop_id in self.active_chains:
            del self.active_chains[crop_id]

# Global service instance
crop_ai_service = CropAIService()