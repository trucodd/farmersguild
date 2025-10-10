from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models import Base
from routers import auth, users, chat, market, crops, commodities, marketplace, labor, crop_ai, costs, weather, crop_details, disease_detection, crop_data, activity_logs, stats
import redis
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Farmers Guild API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis connection
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(market.router, prefix="/api/market", tags=["market"])
app.include_router(crops.router, prefix="/api/crops", tags=["crops"])
app.include_router(commodities.router, prefix="/api", tags=["commodities"])
app.include_router(marketplace.router, prefix="/api/marketplace", tags=["marketplace"])
app.include_router(labor.router, prefix="/api/labor", tags=["labor"])
app.include_router(crop_ai.router)
app.include_router(crop_details.router, prefix="/api/crops", tags=["crop-details"])
app.include_router(costs.router, prefix="/api/costs", tags=["costs"])
app.include_router(weather.router, prefix="/api/weather", tags=["weather"])
app.include_router(disease_detection.router, prefix="/api/disease", tags=["disease-detection"])
app.include_router(crop_data.router, prefix="/api/crop-data", tags=["crop-data"])
app.include_router(activity_logs.router, prefix="/api/crops", tags=["activity-logs"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])

@app.get("/")
async def root():
    return {"message": "Farmers Guild API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}