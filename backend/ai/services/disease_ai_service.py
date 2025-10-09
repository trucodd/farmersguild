from typing import Dict
from sqlalchemy.orm import Session
from ..chains.disease_detection_chain import DiseaseDetectionChain

class DiseaseAIService:
    def __init__(self):
        self.active_chains: Dict[int, DiseaseDetectionChain] = {}
        self.disease_contexts: Dict[int, dict] = {}
    
    def get_disease_chain(self, crop_id: int, db: Session) -> DiseaseDetectionChain:
        """Get or create disease detection chain for specific crop"""
        if crop_id not in self.active_chains:
            self.active_chains[crop_id] = DiseaseDetectionChain(crop_id, db)
        return self.active_chains[crop_id]
    
    async def analyze_disease_image(self, image_base64: str, crop_id: int, db: Session) -> dict:
        """Analyze crop image for disease detection"""
        chain = self.get_disease_chain(crop_id, db)
        result = chain.analyze_disease(image_base64)
        
        # Store disease context for future chat
        self.disease_contexts[crop_id] = result
        
        return result
    
    async def chat_about_disease(self, disease_name: str, detection_id: int, message: str, db: Session) -> str:
        """Chat about a specific disease"""
        # Get crop_id from detection_id
        from models import DiseaseDetection
        detection = db.query(DiseaseDetection).filter(DiseaseDetection.id == detection_id).first()
        if not detection:
            raise ValueError("Detection not found")
        
        chain = self.get_disease_chain(detection.crop_id, db)
        return chain.chat_about_disease(disease_name, detection_id, message)
    
    def clear_disease_chain(self, crop_id: int):
        """Clear cached chain for crop"""
        if crop_id in self.active_chains:
            del self.active_chains[crop_id]
        if crop_id in self.disease_contexts:
            del self.disease_contexts[crop_id]

# Global service instance
disease_ai_service = DiseaseAIService()