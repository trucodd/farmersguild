from fastapi import APIRouter, HTTPException, Depends
import httpx
import os
import logging
from routers.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/weather/{zipcode}")
async def get_weather(zipcode: str):
    """Get weather data for a zipcode"""
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Weather API key not configured")
    
    url = f"https://api.openweathermap.org/data/2.5/weather?zip={zipcode},IN&appid={api_key}&units=metric"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            logger.info(f"Fetching weather for URL: {url}")
            response = await client.get(url)
            logger.info(f"Weather API response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Weather data received for {zipcode}")
                return data
            else:
                error_text = response.text
                logger.error(f"Weather API error {response.status_code}: {error_text}")
                raise HTTPException(status_code=response.status_code, detail=f"Weather API error: {error_text}")
    except httpx.TimeoutException:
        logger.error(f"Timeout fetching weather for {zipcode}")
        raise HTTPException(status_code=504, detail="Weather API timeout")
    except Exception as e:
        logger.error(f"Weather API exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch weather data: {str(e)}")

@router.get("/forecast/{zipcode}")
async def get_forecast(zipcode: str):
    """Get 5-day weather forecast for a zipcode"""
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Weather API key not configured")
    
    url = f"https://api.openweathermap.org/data/2.5/forecast?zip={zipcode},IN&appid={api_key}&units=metric"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            logger.info(f"Fetching forecast for URL: {url}")
            response = await client.get(url)
            logger.info(f"Forecast API response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Forecast data received for {zipcode}")
                return data
            else:
                error_text = response.text
                logger.error(f"Forecast API error {response.status_code}: {error_text}")
                raise HTTPException(status_code=response.status_code, detail=f"Forecast API error: {error_text}")
    except httpx.TimeoutException:
        logger.error(f"Timeout fetching forecast for {zipcode}")
        raise HTTPException(status_code=504, detail="Forecast API timeout")
    except Exception as e:
        logger.error(f"Forecast API exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch forecast data: {str(e)}")