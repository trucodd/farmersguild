from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, func, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import uuid
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    is_admin = Column(Boolean, default=False)
    state = Column(String)
    district = Column(String)
    location = Column(String)
    is_available_for_work = Column(Boolean, default=False)
    max_travel_distance_km = Column(Integer, default=25)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    conversations = relationship("Conversation", back_populates="user")

class Commodity(Base):
    __tablename__ = "commodities"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

class District(Base):
    __tablename__ = "districts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    state = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    
    __table_args__ = ({'extend_existing': True},)

class Crop(Base):
    __tablename__ = "crops"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    crop_type = Column(String)  # tomato, corn, etc.
    variety = Column(String)
    planting_date = Column(DateTime)
    harvest_date = Column(String)
    growth_stage = Column(String)  # seedling, flowering, etc.
    area = Column(String)
    soil_type = Column(String)
    notes = Column(Text)
    state = Column(String)
    district = Column(String)
    location = Column(String)
    zipcode = Column(String)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    title = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"))
    content = Column(Text)
    role = Column(String)  # 'user' or 'assistant'
    embedding = Column(Text)  # Store as text instead of vector
    created_at = Column(DateTime, default=datetime.utcnow)
    
    conversation = relationship("Conversation", back_populates="messages")

class CropCost(Base):
    __tablename__ = "crop_costs"
    
    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    expense_type = Column(String, nullable=False)  # seed, fertilizer, pesticide, labor, transport, other
    title = Column(String)  # custom title for 'other' expense type
    amount = Column(Float, nullable=False)
    description = Column(String)
    date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, server_default=func.now())

class DiseaseDetection(Base):
    __tablename__ = "disease_detections"
    
    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
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
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    activity_type = Column(String)
    description = Column(Text)
    quantity = Column(Float)
    unit = Column(String)
    notes = Column(Text)
    performed_at = Column(DateTime, default=datetime.utcnow)

class CropConversation(Base):
    __tablename__ = "crop_conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    message = Column(Text)
    response = Column(Text)
    context_used = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class DiseaseChatHistory(Base):
    __tablename__ = "disease_chat_history"
    
    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(Integer, ForeignKey("disease_detections.id"), nullable=False)
    message = Column(Text)
    response = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)