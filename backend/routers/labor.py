from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def labor_home():
    return {"message": "Labor feature temporarily disabled"}