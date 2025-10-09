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
        
        # Extract crop data immediately to avoid session issues
        crop_data = {
            "name": crop.name,
            "variety": crop.variety,
            "area": crop.area,
            "location": crop.location,
            "district": crop.district,
            "state": crop.state,
            "harvest_date": crop.harvest_date,
            "notes": crop.notes,
            "planting_date": crop.planting_date
        }
        
        # Try to get activities, diseases, weather - but don't fail if tables don't exist
        recent_activities = []
        recent_diseases = []
        recent_weather = []
        
        try:
            activities = self.db.query(ActivityLog)\
                .filter(ActivityLog.crop_id == crop_id)\
                .filter(ActivityLog.performed_at >= datetime.utcnow() - timedelta(days=7))\
                .order_by(ActivityLog.performed_at.desc())\
                .limit(10).all()
            
            # Extract activity data immediately
            for activity in activities:
                recent_activities.append({
                    "activity_type": activity.activity_type,
                    "description": activity.description,
                    "quantity": activity.quantity,
                    "unit": activity.unit,
                    "performed_at": activity.performed_at
                })
        except Exception as e:
            print(f"Warning: Could not fetch activities: {e}")
        
        try:
            diseases = self.db.query(DiseaseDetection)\
                .filter(DiseaseDetection.crop_id == crop_id)\
                .filter(DiseaseDetection.detected_at >= datetime.utcnow() - timedelta(days=30))\
                .order_by(DiseaseDetection.detected_at.desc())\
                .limit(5).all()
            
            # Extract disease data immediately
            for disease in diseases:
                recent_diseases.append({
                    "disease_name": disease.disease_name,
                    "confidence": disease.confidence,
                    "severity": disease.severity,
                    "detected_at": disease.detected_at
                })
        except Exception as e:
            print(f"Warning: Could not fetch diseases: {e}")
        
        try:
            weather = self.db.query(WeatherAlert)\
                .filter(WeatherAlert.crop_id == crop_id)\
                .filter(WeatherAlert.created_at >= datetime.utcnow() - timedelta(days=7))\
                .order_by(WeatherAlert.created_at.desc())\
                .limit(5).all()
            
            # Extract weather data immediately
            for alert in weather:
                recent_weather.append({
                    "alert_type": alert.alert_type,
                    "description": alert.description,
                    "is_critical": alert.is_critical,
                    "created_at": alert.created_at
                })
        except Exception as e:
            print(f"Warning: Could not fetch weather: {e}")
        
        return {
            "crop": crop_data,
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
        
        # Crop data is now a dict, not an object
        crop_name = crop.get("name", "Unknown")
        crop_variety = crop.get("variety") or 'Not specified'
        crop_area = crop.get("area") or 'Not specified'
        crop_location = crop.get("location") or 'Not specified'
        crop_district = crop.get("district") or 'Not specified'
        crop_state = crop.get("state") or 'Not specified'
        crop_harvest_date = crop.get("harvest_date") or 'Not specified'
        crop_notes = crop.get("notes") or 'None'
        planting_date = crop.get("planting_date")
        days_since_planting = (datetime.utcnow() - planting_date).days if planting_date else "Unknown"
        
        formatted_context = f"""
CROP INFORMATION:
- Name: {crop_name}
- Variety: {crop_variety}
- Days Since Planting: {days_since_planting}
- Area: {crop_area}
- Location: {crop_location}
- District: {crop_district}
- State: {crop_state}
- Harvest Date: {crop_harvest_date}
- Notes: {crop_notes}

RECENT ACTIVITIES (Last 7 days):
"""
        
        if activities:
            for activity in activities:
                days_ago = (datetime.utcnow() - activity["performed_at"]).days
                activity_type = activity["activity_type"]
                description = activity["description"]
                quantity = activity["quantity"]
                unit = activity["unit"]
                formatted_context += f"- {activity_type}: {description}"
                if quantity:
                    formatted_context += f" ({quantity} {unit})"
                formatted_context += f" - {days_ago} days ago\n"
        else:
            formatted_context += "- No recent activities recorded\n"
        
        formatted_context += "\nDISEASE DETECTIONS (Last 30 days):\n"
        if diseases:
            for disease in diseases:
                days_ago = (datetime.utcnow() - disease["detected_at"]).days
                disease_name = disease["disease_name"]
                confidence = disease["confidence"] or 0
                severity = disease["severity"]
                formatted_context += f"- {disease_name} (Confidence: {confidence:.1%}, Severity: {severity}) - {days_ago} days ago\n"
        else:
            formatted_context += "- No diseases detected\n"
        
        formatted_context += "\nWEATHER ALERTS (Last 7 days):\n"
        if weather:
            for alert in weather:
                days_ago = (datetime.utcnow() - alert["created_at"]).days
                alert_type = alert["alert_type"]
                description = alert["description"]
                is_critical = alert["is_critical"]
                formatted_context += f"- {alert_type}: {description}"
                if is_critical:
                    formatted_context += " (CRITICAL)"
                formatted_context += f" - {days_ago} days ago\n"
        else:
            formatted_context += "- No weather alerts\n"
        
        return formatted_context.strip()