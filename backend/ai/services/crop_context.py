from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from models import Crop, DiseaseDetection, WeatherAlert, ActivityLog, CropConversation

class CropContextService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_crop_context(self, crop_id: int) -> dict:
        """Get comprehensive context for a specific crop"""
        crop = self.db.query(Crop).filter(Crop.id == crop_id).first()
        if not crop:
            return {}
        
        # Try to get activities, diseases, weather - but don't fail if tables don't exist
        recent_activities = []
        recent_diseases = []
        recent_weather = []
        
        try:
            recent_activities = self.db.query(ActivityLog)\
                .filter(ActivityLog.crop_id == crop_id)\
                .filter(ActivityLog.performed_at >= datetime.utcnow() - timedelta(days=7))\
                .order_by(ActivityLog.performed_at.desc())\
                .limit(10).all()
        except Exception as e:
            print(f"Warning: Could not fetch activities: {e}")
        
        try:
            recent_diseases = self.db.query(DiseaseDetection)\
                .filter(DiseaseDetection.crop_id == crop_id)\
                .filter(DiseaseDetection.detected_at >= datetime.utcnow() - timedelta(days=30))\
                .order_by(DiseaseDetection.detected_at.desc())\
                .limit(5).all()
        except Exception as e:
            print(f"Warning: Could not fetch diseases: {e}")
        
        try:
            recent_weather = self.db.query(WeatherAlert)\
                .filter(WeatherAlert.crop_id == crop_id)\
                .filter(WeatherAlert.created_at >= datetime.utcnow() - timedelta(days=7))\
                .order_by(WeatherAlert.created_at.desc())\
                .limit(5).all()
        except Exception as e:
            print(f"Warning: Could not fetch weather: {e}")
        
        return {
            "crop": crop,
            "activities": recent_activities,
            "diseases": recent_diseases,
            "weather": recent_weather
        }
    
    def format_context_for_ai(self, context: dict) -> str:
        """Format context data for AI prompt"""
        if not context:
            return "No crop data available."
        
        crop = context["crop"]
        activities = context["activities"]
        diseases = context["diseases"]
        weather = context["weather"]
        
        # Calculate days since planting
        days_since_planting = (datetime.utcnow() - crop.planting_date).days if crop.planting_date else "Unknown"
        
        formatted_context = f"""
CROP INFORMATION:
- Name: {crop.name}
- Variety: {crop.variety or 'Not specified'}
- Days Since Planting: {days_since_planting}
- Area: {crop.area or 'Not specified'}
- Location: {crop.location or 'Not specified'}
- District: {crop.district or 'Not specified'}
- State: {crop.state or 'Not specified'}
- Harvest Date: {crop.harvest_date or 'Not specified'}
- Notes: {crop.notes or 'None'}

RECENT ACTIVITIES (Last 7 days):
"""
        
        if activities:
            for activity in activities:
                days_ago = (datetime.utcnow() - activity.performed_at).days
                formatted_context += f"- {activity.activity_type}: {activity.description}"
                if activity.quantity:
                    formatted_context += f" ({activity.quantity} {activity.unit})"
                formatted_context += f" - {days_ago} days ago\n"
        else:
            formatted_context += "- No recent activities recorded\n"
        
        formatted_context += "\nDISEASE DETECTIONS (Last 30 days):\n"
        if diseases:
            for disease in diseases:
                days_ago = (datetime.utcnow() - disease.detected_at).days
                formatted_context += f"- {disease.disease_name} (Confidence: {disease.confidence:.1%}, Severity: {disease.severity}) - {days_ago} days ago\n"
        else:
            formatted_context += "- No diseases detected\n"
        
        formatted_context += "\nWEATHER ALERTS (Last 7 days):\n"
        if weather:
            for alert in weather:
                days_ago = (datetime.utcnow() - alert.created_at).days
                formatted_context += f"- {alert.alert_type}: {alert.description}"
                if alert.is_critical:
                    formatted_context += " (CRITICAL)"
                formatted_context += f" - {days_ago} days ago\n"
        else:
            formatted_context += "- No weather alerts\n"
        
        return formatted_context.strip()