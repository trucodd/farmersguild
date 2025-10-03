from sqlalchemy import Column, Integer, String, DateTime, Text, Float, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Crop(Base):
    __tablename__ = "crops"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    crop_type = Column(String)
    variety = Column(String)
    planting_date = Column(DateTime)
    growth_stage = Column(String)
    location = Column(String)
    soil_type = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class DiseaseDetection(Base):
    __tablename__ = "disease_detections"
    
    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"))
    disease_name = Column(String)
    confidence = Column(Float)
    severity = Column(String)
    image_path = Column(String)
    recommendations = Column(Text)
    detected_at = Column(DateTime, default=datetime.utcnow)

class WeatherAlert(Base):
    __tablename__ = "weather_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"))
    alert_type = Column(String)
    description = Column(Text)
    temperature = Column(Float)
    humidity = Column(Float)
    precipitation = Column(Float)
    wind_speed = Column(Float)
    is_critical = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"))
    activity_type = Column(String)  # watering, fertilizing, pruning, etc.
    description = Column(Text)
    quantity = Column(Float)
    unit = Column(String)
    notes = Column(Text)
    performed_at = Column(DateTime, default=datetime.utcnow)

class CropConversation(Base):
    __tablename__ = "crop_conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"))
    message = Column(Text)
    response = Column(Text)
    context_used = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)