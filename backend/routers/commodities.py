from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import requests
import os
import pandas as pd
from io import StringIO
import time
import asyncio

from database import get_db
from models import Commodity
from routers.auth import get_admin_user

router = APIRouter()

# Market Price API configuration
MARKET_PRICE_API_KEY = os.getenv("MARKET_PRICE_API_KEY")
MARKET_PRICE_API_URL = os.getenv("MARKET_PRICE_API_URL", "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24")

@router.get("/commodities")
async def get_commodities(db: Session = Depends(get_db)):
    """Get commodities from database (public access)"""
    try:
        commodities = db.query(Commodity).all()
        commodity_names = sorted([c.name for c in commodities])  # Alphabetical order like fetch
        return {
            "commodities": commodity_names,
            "count": len(commodity_names),
            "source": "database"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching commodities: {str(e)}")

@router.get("/states")
async def get_states():
    """Get all states from API"""
    try:
        params = {
            "api-key": MARKET_PRICE_API_KEY,
            "format": "csv",
            "limit": 10000
        }
        
        response = requests.get(MARKET_PRICE_API_URL, params=params, timeout=30)
        if response.status_code == 200 and response.text.strip():
            df = pd.read_csv(StringIO(response.text))
            if not df.empty and "State" in df.columns:
                states = df["State"].dropna().unique().tolist()
                return {"states": sorted([s.strip() for s in states if s.strip()])}
        
        return {"states": []}
    except Exception as e:
        return {"states": []}

async def _fetch_commodities_from_api():
    """Helper function to fetch commodities from API"""
    if not MARKET_PRICE_API_KEY:
        raise HTTPException(status_code=503, detail="Market API not configured")
    
    all_commodities = set()
    print(f"DEBUG: Starting comprehensive commodity fetch...")
    
    # First get all states
    states_response = await get_states()
    all_states = states_response.get("states", [])
    print(f"DEBUG: Found {len(all_states)} states to sample from")
    
    # Sample commodities from each state
    for i, state in enumerate(all_states):
        params = {
            "api-key": MARKET_PRICE_API_KEY,
            "format": "csv",
            "filters[State]": state,
            "limit": 50000
        }
        
        try:
            response = requests.get(MARKET_PRICE_API_URL, params=params, timeout=30)
            if response.status_code == 200 and response.text.strip():
                df = pd.read_csv(StringIO(response.text))
                if not df.empty and "Commodity" in df.columns:
                    batch_commodities = df["Commodity"].dropna().unique().tolist()
                    new_commodities = [c.strip() for c in batch_commodities if c.strip()]
                    before_count = len(all_commodities)
                    all_commodities.update(new_commodities)
                    after_count = len(all_commodities)
                    print(f"DEBUG: State {i+1}/{len(all_states)} ({state}): +{after_count - before_count} new, total: {after_count}")
        except Exception as e:
            print(f"DEBUG: State {state}: Error - {e}")
            continue
    
    # Sample from recent data without state filter
    print(f"DEBUG: Fetching recent data without state filter...")
    recent_params = {
        "api-key": MARKET_PRICE_API_KEY,
        "format": "csv",
        "sort[Arrival_Date]": "desc",
        "limit": 100000
    }
    
    try:
        response = requests.get(MARKET_PRICE_API_URL, params=recent_params, timeout=30)
        if response.status_code == 200:
            df = pd.read_csv(StringIO(response.text))
            if not df.empty and "Commodity" in df.columns:
                batch_commodities = df["Commodity"].dropna().unique().tolist()
                new_commodities = [c.strip() for c in batch_commodities if c.strip()]
                before_count = len(all_commodities)
                all_commodities.update(new_commodities)
                after_count = len(all_commodities)
                print(f"DEBUG: Recent data: +{after_count - before_count} new, total: {after_count}")
    except Exception as e:
        print(f"DEBUG: Recent data fetch error: {e}")
    
    return sorted(list(all_commodities))

@router.get("/commodities/fetch")
async def fetch_commodities_from_api(admin_user = Depends(get_admin_user)):
    """Get all commodities by sampling from all states (admin only)"""
    try:
        all_commodities_list = await _fetch_commodities_from_api()
        final_count = len(all_commodities_list)
        print(f"DEBUG: Final result: {final_count} unique commodities")
        
        return {
            "commodities": all_commodities_list,
            "count": final_count,
            "source": "api",
            "message": f"Retrieved {final_count} unique commodities"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching commodities: {str(e)}")

@router.post("/commodities/save")
async def save_fetched_commodities_to_db(
    admin_user = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Fetch ALL commodities from API and save to database (admin only)"""
    try:
        # Use the same fetch logic as /fetch endpoint
        all_commodities_list = await _fetch_commodities_from_api()
        
        # Save to database
        existing_names = {c.name for c in db.query(Commodity).all()}
        added_commodities = []
        
        for name in all_commodities_list:
            if name not in existing_names:
                commodity = Commodity(name=name)
                db.add(commodity)
                added_commodities.append(name)
        
        db.commit()
        total_count = db.query(Commodity).count()
        
        print(f"Save complete: {len(added_commodities)} new commodities added")
        if added_commodities:
            print(f"Saved commodities: {', '.join(added_commodities[:10])}{'...' if len(added_commodities) > 10 else ''}")
        
        return {
            "message": f"Saved {len(added_commodities)} new commodities. Total: {total_count}",
            "added": len(added_commodities),
            "total": total_count,
            "fetched_count": len(all_commodities_list),
            "saved_commodities": added_commodities,
            "sample_saved": added_commodities[:10] if added_commodities else []
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.delete("/commodities/clear")
async def clear_all_commodities(
    admin_user = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete ALL commodities from database (admin only)"""
    try:
        deleted_count = db.query(Commodity).count()
        db.query(Commodity).delete()
        db.commit()
        
        return {
            "message": f"Deleted {deleted_count} commodities from database",
            "deleted": deleted_count
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error clearing commodities: {str(e)}")