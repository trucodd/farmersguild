from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def marketplace_home():
    return {"message": "Marketplace feature temporarily disabled"}