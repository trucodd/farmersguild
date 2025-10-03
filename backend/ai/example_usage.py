"""
Example usage of the crop-specific AI system
"""
from sqlalchemy.orm import Session
from database import SessionLocal
from ai.services.crop_ai_service import crop_ai_service
from ai.models import Crop, DiseaseDetection, WeatherAlert, ActivityLog
from datetime import datetime, timedelta

def example_usage():
    db = SessionLocal()
    
    # Example: Create a crop with some history
    crop = Crop(
        user_id=1,
        name="My Tomato Garden",
        crop_type="Tomato",
        variety="Cherry Tomato",
        planting_date=datetime.utcnow() - timedelta(days=45),
        growth_stage="Flowering",
        location="Greenhouse A",
        soil_type="Loamy"
    )
    db.add(crop)
    db.commit()
    
    # Add some activities
    activities = [
        ActivityLog(
            crop_id=crop.id,
            activity_type="watering",
            description="Deep watering",
            quantity=2.5,
            unit="liters",
            performed_at=datetime.utcnow() - timedelta(days=1)
        ),
        ActivityLog(
            crop_id=crop.id,
            activity_type="fertilizing",
            description="Applied organic fertilizer",
            quantity=100,
            unit="grams",
            performed_at=datetime.utcnow() - timedelta(days=3)
        )
    ]
    
    for activity in activities:
        db.add(activity)
    
    # Add a disease detection
    disease = DiseaseDetection(
        crop_id=crop.id,
        disease_name="Early Blight",
        confidence=0.85,
        severity="Mild",
        recommendations="Apply fungicide and improve air circulation",
        detected_at=datetime.utcnow() - timedelta(days=2)
    )
    db.add(disease)
    
    # Add weather alert
    weather = WeatherAlert(
        crop_id=crop.id,
        alert_type="High Humidity",
        description="Humidity levels above 80% for 3 consecutive days",
        humidity=85.0,
        temperature=28.5,
        is_critical=True,
        created_at=datetime.utcnow() - timedelta(hours=6)
    )
    db.add(weather)
    
    db.commit()
    
    # Now chat with the AI
    print("=== Crop AI Chat Example ===")
    print(f"Crop: {crop.name} ({crop.crop_type})")
    print()
    
    # Example conversations
    messages = [
        "How is my crop doing?",
        "Should I be worried about the disease detection?",
        "What should I do about the high humidity?",
        "When should I water next?"
    ]
    
    for message in messages:
        print(f"User: {message}")
        response = crop_ai_service.chat_with_crop(crop.id, message, db)
        print(f"AI: {response}")
        print("-" * 50)
    
    db.close()

if __name__ == "__main__":
    example_usage()