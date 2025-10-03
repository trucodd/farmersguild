from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import UUID
from database import get_db
from models import User
from routers.auth import oauth2_scheme
from jose import JWTError, jwt
import os

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    state: str = None
    district: str = None
    location: str = None
    is_available_for_work: bool = False
    max_travel_distance_km: int = 25
    
    class Config:
        from_attributes = True
        json_encoders = {
            UUID: str
        }

class ProfileUpdate(BaseModel):
    name: str = None
    state: str = None
    district: str = None
    location: str = None
    is_available_for_work: bool = None
    max_travel_distance_km: int = None

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name or "",
        state=current_user.state or "",
        district=current_user.district or "",
        location=current_user.location or "",
        is_available_for_work=current_user.is_available_for_work or False,
        max_travel_distance_km=current_user.max_travel_distance_km or 25
    )

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile.name is not None:
        current_user.name = profile.name
    if profile.state is not None:
        current_user.state = profile.state
    if profile.district is not None:
        current_user.district = profile.district
    if profile.location is not None:
        current_user.location = profile.location
    if profile.is_available_for_work is not None:
        current_user.is_available_for_work = profile.is_available_for_work
    if profile.max_travel_distance_km is not None:
        current_user.max_travel_distance_km = profile.max_travel_distance_km
    
    db.commit()
    db.refresh(current_user)
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name or "",
        state=current_user.state or "",
        district=current_user.district or "",
        location=current_user.location or "",
        is_available_for_work=current_user.is_available_for_work or False,
        max_travel_distance_km=current_user.max_travel_distance_km or 25
    )

@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully"}