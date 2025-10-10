from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import requests
import os
import pandas as pd
from datetime import datetime, timedelta
from io import StringIO
from sqlalchemy.orm import Session
from database import get_db
from models import User, Crop, District
from openai import OpenAI
# from market_insights import MarketInsightsService  # Commented out as we're using direct API calls

router = APIRouter()

# Background cache refresh disabled to prevent startup issues

# Market Price API configuration
MARKET_PRICE_API_KEY = os.getenv("MARKET_PRICE_API_KEY")
MARKET_PRICE_API_URL = os.getenv("MARKET_PRICE_API_URL", "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Initialize OpenAI client for DeepSeek
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
) if OPENROUTER_API_KEY else None

print(f"Market API Key loaded: {'Yes' if MARKET_PRICE_API_KEY else 'No'}")
print(f"Market API URL: {MARKET_PRICE_API_URL}")
print(f"OpenRouter API Key loaded: {'Yes' if OPENROUTER_API_KEY else 'No'}")

def get_date_range(date_type: str):
    """Get date range based on type: today, yesterday, week"""
    from datetime import datetime, timedelta
    
    today = datetime.now()
    
    if date_type == "today":
        return today.strftime('%d/%m/%Y'), today.strftime('%d/%m/%Y')
    elif date_type == "yesterday":
        yesterday = today - timedelta(days=1)
        return yesterday.strftime('%d/%m/%Y'), yesterday.strftime('%d/%m/%Y')
    elif date_type == "week":
        week_ago = today - timedelta(days=7)
        return week_ago.strftime('%d/%m/%Y'), today.strftime('%d/%m/%Y')
    elif date_type == "month":
        month_ago = today - timedelta(days=30)
        return month_ago.strftime('%d/%m/%Y'), today.strftime('%d/%m/%Y')
    else:
        return None, None

class MarketPriceResponse(BaseModel):
    crop: str
    price: float
    currency: str
    unit: str
    market: str
    date: str
    change: Optional[float] = None
    percentage_change: Optional[float] = None
    variety: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None

class PriceHistoryResponse(BaseModel):
    crop: str
    prices: List[dict]

class MarketInsightsResponse(BaseModel):
    summary: str
    insights: dict
    user_crops: List[str]
    location: str
    available_markets: List[dict] = []

@router.get("/price-comparison/{user_id}")
async def get_price_comparison(
    user_id: str,
    crop: str,
    user_state: str,
    user_district: str,
    db: Session = Depends(get_db)
):
    """Compare prices across nearby markets for the same crop"""
    if not MARKET_PRICE_API_KEY:
        raise HTTPException(status_code=503, detail="API not configured")
    
    try:
        # Get prices from user's district
        local_params = {
            "api-key": MARKET_PRICE_API_KEY,
            "format": "csv",
            "filters[State]": user_state,
            "filters[District]": user_district,
            "filters[Commodity]": crop,
            "limit": 10
        }
        
        # Get prices from same state (nearby districts)
        state_params = {
            "api-key": MARKET_PRICE_API_KEY,
            "format": "csv",
            "filters[State]": user_state,
            "filters[Commodity]": crop,
            "limit": 50
        }
        
        local_response = requests.get(MARKET_PRICE_API_URL, params=local_params, timeout=15)
        state_response = requests.get(MARKET_PRICE_API_URL, params=state_params, timeout=15)
        
        comparison = {"local_markets": [], "nearby_districts": [], "best_opportunity": None}
        
        # Process local markets
        if local_response.status_code == 200:
            local_df = pd.read_csv(StringIO(local_response.text))
            if not local_df.empty:
                for _, row in local_df.iterrows():
                    comparison["local_markets"].append({
                        "market": row.get("Market", ""),
                        "price": float(row.get("Modal_Price", 0)),
                        "variety": row.get("Variety", ""),
                        "date": row.get("Arrival_Date", "")
                    })
        
        # Process nearby districts
        if state_response.status_code == 200:
            state_df = pd.read_csv(StringIO(state_response.text))
            if not state_df.empty:
                # Group by district and get best price from each
                for district, group in state_df.groupby("District"):
                    if district != user_district:
                        best_price_row = group.loc[group["Modal_Price"].idxmax()]
                        comparison["nearby_districts"].append({
                            "district": district,
                            "market": best_price_row.get("Market", ""),
                            "price": float(best_price_row.get("Modal_Price", 0)),
                            "variety": best_price_row.get("Variety", ""),
                            "date": best_price_row.get("Arrival_Date", "")
                        })
        
        # Find best opportunity
        all_prices = comparison["local_markets"] + comparison["nearby_districts"]
        if all_prices:
            best = max(all_prices, key=lambda x: x["price"])
            local_avg = sum(p["price"] for p in comparison["local_markets"]) / len(comparison["local_markets"]) if comparison["local_markets"] else 0
            
            if best["price"] > local_avg * 1.1:  # 10% better
                comparison["best_opportunity"] = {
                    **best,
                    "price_difference": best["price"] - local_avg,
                    "percentage_better": ((best["price"] - local_avg) / local_avg * 100) if local_avg > 0 else 0
                }
        
        return comparison
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing prices: {str(e)}")

@router.get("/variety-analysis/{user_id}")
async def get_variety_analysis(
    user_id: str,
    crop: str,
    state: str,
    district: str,
    db: Session = Depends(get_db)
):
    """Analyze which variety of crop gets better prices"""
    if not MARKET_PRICE_API_KEY:
        raise HTTPException(status_code=503, detail="API not configured")
    
    try:
        params = {
            "api-key": MARKET_PRICE_API_KEY,
            "format": "csv",
            "filters[State]": state,
            "filters[District]": district,
            "filters[Commodity]": crop,
            "limit": 50
        }
        
        response = requests.get(MARKET_PRICE_API_URL, params=params, timeout=15)
        if response.status_code != 200:
            return {"varieties": [], "recommendation": "No data available"}
        
        df = pd.read_csv(StringIO(response.text))
        if df.empty:
            return {"varieties": [], "recommendation": "No data available"}
        
        # Analyze by variety
        variety_analysis = []
        for variety, group in df.groupby("Variety"):
            if pd.notna(variety) and variety.strip():
                avg_price = group["Modal_Price"].mean()
                max_price = group["Modal_Price"].max()
                count = len(group)
                
                variety_analysis.append({
                    "variety": variety,
                    "average_price": float(avg_price),
                    "highest_price": float(max_price),
                    "market_count": count,
                    "price_per_kg": float(avg_price / 100)
                })
        
        # Sort by average price
        variety_analysis.sort(key=lambda x: x["average_price"], reverse=True)
        
        # Generate recommendation
        if variety_analysis:
            best_variety = variety_analysis[0]
            recommendation = f"{best_variety['variety']} variety gets best price at ₹{best_variety['average_price']:.0f}/quintal (₹{best_variety['price_per_kg']:.1f}/kg)"
        else:
            recommendation = "No variety data available"
        
        return {
            "varieties": variety_analysis,
            "recommendation": recommendation,
            "total_varieties": len(variety_analysis)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing varieties: {str(e)}")

@router.get("/seasonal-pattern/{user_id}")
async def get_seasonal_pattern(
    user_id: str,
    crop: str,
    state: str,
    district: str,
    db: Session = Depends(get_db)
):
    """Analyze seasonal price patterns using arrival dates"""
    if not MARKET_PRICE_API_KEY:
        raise HTTPException(status_code=503, detail="API not configured")
    
    try:
        params = {
            "api-key": MARKET_PRICE_API_KEY,
            "format": "csv",
            "filters[State]": state,
            "filters[District]": district,
            "filters[Commodity]": crop,
            "limit": 100
        }
        
        response = requests.get(MARKET_PRICE_API_URL, params=params, timeout=15)
        if response.status_code != 200:
            return {"monthly_prices": [], "insight": "No data available"}
        
        df = pd.read_csv(StringIO(response.text))
        if df.empty:
            return {"monthly_prices": [], "insight": "No data available"}
        
        # Extract month from arrival date and analyze
        monthly_prices = []
        try:
            df["Arrival_Date"] = pd.to_datetime(df["Arrival_Date"], format="%d/%m/%Y", errors="coerce")
            df = df.dropna(subset=["Arrival_Date"])
            
            if not df.empty:
                df["Month"] = df["Arrival_Date"].dt.month
                df["Month_Name"] = df["Arrival_Date"].dt.strftime("%B")
                
                for month, group in df.groupby(["Month", "Month_Name"]):
                    avg_price = group["Modal_Price"].mean()
                    monthly_prices.append({
                        "month": month[1],
                        "average_price": float(avg_price),
                        "records": len(group)
                    })
                
                monthly_prices.sort(key=lambda x: x["average_price"], reverse=True)
        except:
            pass
        
        # Generate insight
        if monthly_prices:
            best_month = monthly_prices[0]
            worst_month = monthly_prices[-1]
            insight = f"Best prices in {best_month['month']} (₹{best_month['average_price']:.0f}), lowest in {worst_month['month']} (₹{worst_month['average_price']:.0f})"
        else:
            insight = "Unable to determine seasonal pattern"
        
        return {
            "monthly_prices": monthly_prices,
            "insight": insight,
            "data_points": len(df) if not df.empty else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing seasonal pattern: {str(e)}")

@router.get("/debug-api-call")
async def debug_api_call(
    state: str = "Jammu and Kashmir",
    district: str = "Jammu", 
    commodity: str = "Apple"
):
    """Debug API call to test different date formats"""
    if not MARKET_PRICE_API_KEY:
        return {"error": "API key not configured"}
    
    try:
        from datetime import datetime, timedelta
        
        today = datetime.now()
        results = {}
        
        # Test different date formats with single date filter
        date_tests = [
            ("today_ddmmyyyy", today.strftime('%d/%m/%Y')),
            ("yesterday_ddmmyyyy", (today - timedelta(days=1)).strftime('%d/%m/%Y')),
            ("week_ago_ddmmyyyy", (today - timedelta(days=7)).strftime('%d/%m/%Y')),
            ("month_ago_ddmmyyyy", (today - timedelta(days=30)).strftime('%d/%m/%Y')),
            ("today_yyyymmdd", today.strftime('%Y-%m-%d')),
            ("yesterday_yyyymmdd", (today - timedelta(days=1)).strftime('%Y-%m-%d')),
            ("week_ago_yyyymmdd", (today - timedelta(days=7)).strftime('%Y-%m-%d')),
            ("no_date_filter", None)
        ]
        
        for test_name, date_value in date_tests:
            params = {
                "api-key": MARKET_PRICE_API_KEY,
                "format": "csv",
                "filters[State]": state,
                "filters[District]": district,
                "filters[Commodity]": commodity,
                "limit": 10
            }
            
            if date_value:
                params["filters[Arrival_Date]"] = date_value
            
            try:
                response = requests.get(MARKET_PRICE_API_URL, params=params, timeout=15)
                if response.status_code == 200:
                    df = pd.read_csv(StringIO(response.text))
                    results[test_name] = {
                        "date_used": date_value,
                        "records_found": len(df),
                        "sample_dates": df['Arrival_Date'].unique().tolist()[:5] if 'Arrival_Date' in df.columns and not df.empty else [],
                        "sample_prices": df['Modal_Price'].tolist()[:3] if 'Modal_Price' in df.columns and not df.empty else [],
                        "url": f"{MARKET_PRICE_API_URL}?{requests.compat.urlencode(params)}"
                    }
                else:
                    results[test_name] = {"date_used": date_value, "status": response.status_code, "error": response.text[:100]}
            except Exception as e:
                results[test_name] = {"date_used": date_value, "error": str(e)}
        
        return results
        
    except Exception as e:
        return {"error": f"Debug failed: {str(e)}"}

@router.get("/market-opportunities/{user_id}")
async def get_market_opportunities(
    user_id: str,
    crop: str,
    user_state: str,
    db: Session = Depends(get_db)
):
    """Find best market opportunities across the state using AI analysis"""
    if not MARKET_PRICE_API_KEY or not client:
        raise HTTPException(status_code=503, detail="API or AI not configured")
    
    try:
        # Get data from entire state
        params = {
            "api-key": MARKET_PRICE_API_KEY,
            "format": "csv",
            "filters[State]": user_state,
            "filters[Commodity]": crop,
            "limit": 100
        }
        
        response = requests.get(MARKET_PRICE_API_URL, params=params, timeout=15)
        if response.status_code != 200:
            return {"opportunities": [], "ai_recommendation": "No data available"}
        
        df = pd.read_csv(StringIO(response.text))
        if df.empty:
            return {"opportunities": [], "ai_recommendation": "No data available"}
        
        # Analyze opportunities by district and market
        opportunities = []
        for (district, market), group in df.groupby(["District", "Market"]):
            avg_price = group["Modal_Price"].mean()
            max_price = group["Modal_Price"].max()
            varieties = group["Variety"].unique().tolist()
            
            opportunities.append({
                "district": district,
                "market": market,
                "average_price": float(avg_price),
                "highest_price": float(max_price),
                "varieties_accepted": [v for v in varieties if pd.notna(v)],
                "price_per_kg": float(avg_price / 100)
            })
        
        # Sort by price
        opportunities.sort(key=lambda x: x["average_price"], reverse=True)
        top_opportunities = opportunities[:10]
        
        # Generate AI recommendation
        analysis_text = f"Market Opportunities for {crop} in {user_state}:\n\n"
        for i, opp in enumerate(top_opportunities[:5], 1):
            analysis_text += f"{i}. {opp['market']}, {opp['district']} - ₹{opp['average_price']:.0f}/quintal\n"
        
        prompt = f"""
Analyze these market opportunities for a farmer selling {crop}:

{analysis_text}

Provide practical advice:
1. Which markets offer the best value considering transport costs?
2. Are the price differences significant enough to justify travel?
3. What should the farmer consider when choosing between these markets?
4. Simple recommendation for the farmer.

Keep advice practical and under 100 words.
"""
        
        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "https://farmersguild.com",
                "X-Title": "Farmers Guild Market Opportunities",
            },
            model="deepseek/deepseek-chat-v3.1:free",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.7
        )
        
        return {
            "opportunities": top_opportunities,
            "ai_recommendation": completion.choices[0].message.content,
            "total_markets_analyzed": len(opportunities)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finding opportunities: {str(e)}")

@router.get("/api-status")
async def check_api_status():
    """Check if market API and AI are configured"""
    test_result = "not tested"
    if MARKET_PRICE_API_KEY:
        try:
            test_params = {
                "api-key": MARKET_PRICE_API_KEY,
                "format": "csv",
                "limit": 10
            }
            test_response = requests.get(MARKET_PRICE_API_URL, params=test_params, timeout=15)
            test_result = f"HTTP {test_response.status_code}"
            if test_response.status_code == 200:
                df = pd.read_csv(StringIO(test_response.text))
                test_result += f" - {len(df)} records, columns: {list(df.columns)[:5]}"
            else:
                test_result += f" - {test_response.text[:100]}"
        except Exception as e:
            test_result = f"Error: {str(e)}"
    
    return {
        "api_key_loaded": bool(MARKET_PRICE_API_KEY),
        "api_key_preview": MARKET_PRICE_API_KEY[:10] + "..." if MARKET_PRICE_API_KEY else None,
        "api_url": MARKET_PRICE_API_URL,
        "openrouter_api_loaded": bool(OPENROUTER_API_KEY),
        "ai_model": "deepseek/deepseek-chat-v3.1:free" if OPENROUTER_API_KEY else "not configured",
        "status": "configured" if MARKET_PRICE_API_KEY else "not configured",
        "test_result": test_result,
        "note": "API configured with AI-powered market analysis"
    }

@router.get("/states")
async def get_states(db: Session = Depends(get_db)):
    """Get all states from database for dropdown options"""
    try:
        states = db.query(District.state).distinct().order_by(District.state).all()
        state_list = [state[0] for state in states]
        return {"states": state_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching states: {str(e)}")

@router.get("/districts/{state}")
async def get_districts(state: str, db: Session = Depends(get_db)):
    """Get all districts for a specific state from database for dropdown options"""
    try:
        districts = db.query(District.name).filter(District.state == state).order_by(District.name).all()
        district_list = [district[0] for district in districts]
        return {"districts": district_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching districts: {str(e)}")



@router.get("/market-prices")
async def get_market_prices(
    state: str,
    district: str,
    commodity: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    sort_order: Optional[str] = "desc",
    limit: Optional[int] = 10
):
    """Get recent market prices with filters and sorting"""
    try:
        if not MARKET_PRICE_API_KEY:
            raise HTTPException(status_code=503, detail="Market API not configured")
        
        # Try to get recent data if no dates provided
        if not from_date and not to_date:
            from datetime import datetime, timedelta
            # Try recent dates in DD/MM/YYYY format
            to_date = datetime.now().strftime('%d/%m/%Y')
            from_date = (datetime.now() - timedelta(days=30)).strftime('%d/%m/%Y')
        
        params = {
            "api-key": MARKET_PRICE_API_KEY,
            "format": "csv",
            "filters[State]": state,
            "filters[District]": district,
            "limit": limit
        }
        if commodity:
            params["filters[Commodity]"] = commodity
        
        # Try single date filter first (more likely to work)
        if to_date:
            params["filters[Arrival_Date]"] = to_date
        elif from_date:
            params["filters[Arrival_Date]"] = from_date
        
        response = requests.get(MARKET_PRICE_API_URL, params=params, timeout=15)
        if response.status_code != 200:
            return {"prices": [], "date_range": f"{from_date} to {to_date}"}
        
        df = pd.read_csv(StringIO(response.text))
        
        if df.empty:
            return {"prices": [], "date_range": f"{from_date} to {to_date}"}
        
        # Clean and process data with pandas
        if 'Modal_Price' in df.columns:
            df = df.dropna(subset=['Modal_Price'])
            df['Modal_Price'] = pd.to_numeric(df['Modal_Price'], errors='coerce')
            df = df.dropna(subset=['Modal_Price'])
            
            # Sort by date (most recent first) then by price
            if 'Arrival_Date' in df.columns:
                df = df.sort_values(['Arrival_Date', 'Modal_Price'], ascending=[False, sort_order == "asc"])
            else:
                ascending = sort_order == "asc"
                df = df.sort_values('Modal_Price', ascending=ascending)
        
        # Convert to list of dicts
        prices = []
        for _, row in df.head(limit).iterrows():
            modal_price = row.get("Modal_Price", 0)
            prices.append({
                "commodity": row.get("Commodity", ""),
                "state": row.get("State", ""),
                "district": row.get("District", ""),
                "market": row.get("Market", ""),
                "price": float(modal_price) if modal_price else 0,
                "min_price": float(row.get("Min_Price", modal_price)) if row.get("Min_Price") else float(modal_price) if modal_price else 0,
                "max_price": float(row.get("Max_Price", modal_price)) if row.get("Max_Price") else float(modal_price) if modal_price else 0,
                "variety": row.get("Variety", ""),
                "date": row.get("Arrival_Date", "")
            })
        
        return {
            "prices": prices,
            "total_records": len(prices),
            "date_range": f"{from_date} to {to_date}" if from_date and to_date else "Available data"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching market prices: {str(e)}")

@router.get("/insights/{user_id}")
async def get_market_insights(
    user_id: str, 
    market_state: Optional[str] = None,
    market_district: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get AI-powered market insights for user's crops using real API data"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_crops = db.query(Crop).filter(Crop.user_id == user_id).all()
        if not user_crops:
            raise HTTPException(status_code=400, detail="No crops found for user")
        
        if not market_state or not market_district:
            raise HTTPException(status_code=400, detail="Market state and district required")
        
        crop_names = [crop.name for crop in user_crops]
        all_insights = {}
        
        # Get comprehensive historical market data for each crop
        for crop_name in crop_names:
            try:
                # Call the updated crop insights endpoint with enhanced historical data
                crop_insight = await get_crop_insights(user_id, crop_name, market_state, market_district, db=db)
                if crop_insight.get("insights"):
                    all_insights.update(crop_insight["insights"])
                    print(f"✓ Got {crop_insight.get('total_records', 0)} historical records for {crop_name}")
                else:
                    print(f"⚠️ No insights data for {crop_name}")
            except Exception as e:
                print(f"❌ Error getting insights for {crop_name}: {e}")
                continue
        
        # Generate AI-powered overall summary with historical context
        if not all_insights:
            summary = f"📊 No recent market data available for your crops ({', '.join(crop_names)}) in {market_district}, {market_state}. Try checking nearby districts or contact local markets directly."
        else:
            total_historical_records = sum(data.get('historical_data_available', 0) for data in all_insights.values())
            print(f"📈 Generating AI analysis with {total_historical_records} total historical records")
            summary = await generate_multi_crop_ai_analysis(crop_names, market_district, market_state, all_insights)
        
        # Enhanced response with historical context
        total_records = sum(data.get('historical_data_available', 0) for data in all_insights.values())
        data_quality = "excellent" if total_records >= 50 else "good" if total_records >= 20 else "limited"
        
        return {
            "summary": summary,
            "insights": all_insights,
            "user_crops": crop_names,
            "location": f"{market_district}, {market_state}",
            "data_source": "historical_api_with_ai",
            "total_historical_records": total_records,
            "data_quality": data_quality,
            "analysis_period": "past_month_trends"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")

async def generate_multi_crop_ai_analysis(crops: list, district: str, state: str, insights_data: dict) -> str:
    """Generate AI analysis for multiple crops with historical context"""
    if not client:
        # Enhanced fallback analysis with historical trends
        rising_crops = [crop for crop, data in insights_data.items() if data.get('trend') == 'rising']
        falling_crops = [crop for crop, data in insights_data.items() if data.get('trend') == 'falling']
        stable_crops = [crop for crop, data in insights_data.items() if data.get('trend') == 'stable']
        
        summary = f"📊 Multi-Crop Market Analysis for {district}, {state}:\n\n"
        
        if rising_crops:
            summary += f"📈 RISING PRICES: {', '.join(rising_crops)} - Good time to sell!\n"
        if falling_crops:
            summary += f"📉 DECLINING PRICES: {', '.join(falling_crops)} - Consider waiting or check other markets.\n"
        if stable_crops:
            summary += f"➡️ STABLE PRICES: {', '.join(stable_crops)} - Shop around for better rates.\n"
        
        # Add specific price insights
        best_price_crop = max(insights_data.items(), key=lambda x: x[1].get('latest_price', 0))
        summary += f"\n💰 HIGHEST PRICE: {best_price_crop[0]} at ₹{best_price_crop[1].get('latest_price', 0):.0f}/quintal\n"
        
        # Add data quality info
        total_records = sum(data.get('historical_data_available', 0) for data in insights_data.values())
        summary += f"\n📋 Analysis based on {total_records} historical market records."
        
        return summary
    
    try:
        # Enhanced multi-crop data preparation with historical trends
        analysis_text = f"Historical Multi-Crop Market Analysis for {district}, {state}:\n\n"
        
        # Sort crops by price for better analysis
        sorted_crops = sorted(insights_data.items(), key=lambda x: x[1].get('latest_price', 0), reverse=True)
        
        analysis_text += "📊 CROP PERFORMANCE SUMMARY:\n"
        for i, (crop, data) in enumerate(sorted_crops, 1):
            trend_emoji = "📈" if data.get('trend') == 'rising' else "📉" if data.get('trend') == 'falling' else "➡️"
            analysis_text += f"{i}. {crop} {trend_emoji}:\n"
            analysis_text += f"   • Current: ₹{data.get('latest_price', 0):.0f}/quintal (₹{data.get('current_price_per_kg', 0):.1f}/kg)\n"
            analysis_text += f"   • Range: {data.get('typical_price_range', 'N/A')}\n"
            analysis_text += f"   • Status: {data.get('price_status', 'Average')}\n"
            analysis_text += f"   • Trend: {data.get('trend', 'stable')} (based on {data.get('historical_data_available', 0)} records)\n"
            analysis_text += f"   • Market Confidence: {data.get('market_confidence', 'moderate')}\n"
            analysis_text += f"   • Volatility: {data.get('price_volatility', 'moderate')}\n\n"
        
        # Add market context
        total_records = sum(data.get('historical_data_available', 0) for data in insights_data.values())
        analysis_text += f"📋 ANALYSIS CONTEXT:\n"
        analysis_text += f"• Total Historical Records: {total_records}\n"
        analysis_text += f"• Market Location: {district}, {state}\n"
        analysis_text += f"• Analysis Period: Past month with recent trends\n\n"
        
        # Enhanced AI prompt with historical context
        prompt = f"""
Analyze this comprehensive historical market data to help the farmer make strategic decisions:

{analysis_text}

Based on the month-long historical trends and current market conditions, provide:

1. **Priority Selling**: Which crops should be sold immediately based on price trends?
2. **Market Strategy**: Which crops need market shopping vs local selling?
3. **Timing Advice**: Which crops to hold vs sell based on historical patterns?
4. **Risk Assessment**: Which crops have volatile prices requiring quick action?
5. **Weekly Action Plan**: Specific steps for the next 7 days.

Use the historical trend data to give strategic, data-driven advice. Keep under 180 words.
"""
        
        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "https://farmersguild.com",
                "X-Title": "Farmers Guild Historical Multi-Crop Analysis",
            },
            model="deepseek/deepseek-chat-v3.1:free",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.7
        )
        
        return completion.choices[0].message.content
        
    except Exception as e:
        print(f"Multi-crop AI analysis error: {e}")
        # Enhanced fallback with historical context
        rising_count = len([c for c, d in insights_data.items() if d.get('trend') == 'rising'])
        falling_count = len([c for c, d in insights_data.items() if d.get('trend') == 'falling'])
        total_records = sum(data.get('historical_data_available', 0) for data in insights_data.values())
        
        return f"📊 Historical analysis for {len(insights_data)} crops in {district}, {state}: {rising_count} rising, {falling_count} falling. Based on {total_records} market records over the past month. Check individual crop trends for selling decisions."

async def generate_ai_market_analysis(crop: str, district: str, state: str, raw_data: list, price_analysis: dict) -> str:
    """Generate AI-powered market analysis using DeepSeek model with historical data"""
    if not client:
        # Enhanced fallback with historical context
        current_price = price_analysis.get('latest_price', 0)
        trend = price_analysis.get('trend', 'stable')
        price_change = price_analysis.get('price_change', 0)
        avg_price = price_analysis.get('avg_price', 0)
        min_price = price_analysis.get('min_price', 0)
        max_price = price_analysis.get('max_price', 0)
        
        # Create historical context from raw data
        historical_context = ""
        if len(raw_data) > 1:
            dates = [r.get('date', '') for r in raw_data if r.get('date')]
            prices = [r.get('modal_price', 0) for r in raw_data if r.get('modal_price', 0) > 0]
            
            if len(prices) > 1:
                price_trend = "rising" if prices[-1] > prices[0] else "falling" if prices[-1] < prices[0] else "stable"
                historical_context = f"Over the past month, prices have been {price_trend}. "
                
                # Add specific price movements
                if len(prices) >= 3:
                    recent_avg = sum(prices[-3:]) / 3
                    older_avg = sum(prices[:3]) / 3 if len(prices) >= 6 else sum(prices[:-3]) / len(prices[:-3]) if len(prices) > 3 else recent_avg
                    
                    if recent_avg > older_avg * 1.05:
                        historical_context += f"Recent prices (₹{recent_avg:.0f}) are {((recent_avg/older_avg-1)*100):.1f}% higher than earlier. "
                    elif recent_avg < older_avg * 0.95:
                        historical_context += f"Recent prices (₹{recent_avg:.0f}) are {((1-recent_avg/older_avg)*100):.1f}% lower than earlier. "
        
        summary = f"📊 Market Analysis for {crop} in {district}, {state}:\n\n"
        summary += f"💰 Current Price: ₹{current_price:.0f}/quintal (₹{current_price/100:.1f}/kg)\n"
        summary += f"📈 Price Range: ₹{min_price:.0f} - ₹{max_price:.0f} (Avg: ₹{avg_price:.0f})\n"
        summary += f"📊 {historical_context}" if historical_context else ""
        
        if trend == "rising":
            summary += f"🔥 Trending UP by ₹{price_change:.0f}. Good time to sell!\n"
        elif trend == "falling":
            summary += f"📉 Declining by ₹{abs(price_change):.0f}. Consider waiting or check other markets.\n"
        else:
            summary += f"➡️ Stable prices. Check nearby markets for better rates.\n"
        
        summary += f"\n📍 Based on {len(raw_data)} recent market records."
        return summary
    
    try:
        # Enhanced market data preparation with historical analysis
        historical_prices = [r.get('modal_price', 0) for r in raw_data if r.get('modal_price', 0) > 0]
        historical_dates = [r.get('date', '') for r in raw_data if r.get('date')]
        
        # Calculate month-over-month trends
        monthly_trend = "stable"
        if len(historical_prices) >= 5:
            recent_prices = historical_prices[-3:]
            older_prices = historical_prices[:3]
            recent_avg = sum(recent_prices) / len(recent_prices)
            older_avg = sum(older_prices) / len(older_prices)
            
            change_pct = ((recent_avg / older_avg) - 1) * 100 if older_avg > 0 else 0
            if change_pct > 10:
                monthly_trend = f"rising {change_pct:.1f}%"
            elif change_pct < -10:
                monthly_trend = f"falling {abs(change_pct):.1f}%"
            else:
                monthly_trend = f"stable (±{abs(change_pct):.1f}%)"
        
        market_data_text = f"Historical Market Analysis for {crop} in {district}, {state}:\n\n"
        market_data_text += f"📊 CURRENT SITUATION:\n"
        market_data_text += f"- Latest Price: ₹{price_analysis.get('latest_price', 0):.0f}/quintal (₹{price_analysis.get('current_price_per_kg', 0):.1f}/kg)\n"
        market_data_text += f"- Price Status: {price_analysis.get('price_status', 'Average')}\n"
        market_data_text += f"- Monthly Trend: {monthly_trend}\n\n"
        
        market_data_text += f"📈 HISTORICAL DATA ({len(raw_data)} records):\n"
        market_data_text += f"- Price Range: ₹{price_analysis.get('min_price', 0):.0f} - ₹{price_analysis.get('max_price', 0):.0f}\n"
        market_data_text += f"- Average Price: ₹{price_analysis.get('avg_price', 0):.0f}\n"
        
        if len(historical_prices) >= 3:
            market_data_text += f"- Recent 3 records avg: ₹{sum(historical_prices[-3:])/3:.0f}\n"
            if len(historical_prices) >= 6:
                market_data_text += f"- Earlier 3 records avg: ₹{sum(historical_prices[:3])/3:.0f}\n"
        
        if raw_data:
            market_data_text += f"\n🏪 RECENT MARKET RECORDS:\n"
            for i, record in enumerate(raw_data[:5], 1):
                market_data_text += f"{i}. {record.get('date', 'N/A')} | {record.get('market', 'N/A')} | ₹{record.get('modal_price', 0):.0f} | {record.get('variety', 'N/A')}\n"
        
        # Enhanced AI prompt with historical context
        prompt = f"""
Analyze this historical market data to provide actionable insights for a farmer:

{market_data_text}

Based on the month-long price history and trends, provide:

1. **Price Assessment**: How does current price compare to the historical range?
2. **Trend Analysis**: What does the month-over-month data suggest?
3. **Market Timing**: Should farmer sell now or wait based on historical patterns?
4. **Market Selection**: Which specific markets show better historical prices?
5. **Practical Action**: Concrete next steps based on the data trends.

Use the actual historical data to give specific, data-driven advice. Keep under 150 words.
"""
        
        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "https://farmersguild.com",
                "X-Title": "Farmers Guild Historical Market Analysis",
            },
            model="deepseek/deepseek-chat-v3.1:free",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=400,
            temperature=0.7
        )
        
        return completion.choices[0].message.content
        
    except Exception as e:
        print(f"AI analysis error: {e}")
        # Enhanced fallback with historical context
        current_price = price_analysis.get('latest_price', 0)
        trend = price_analysis.get('trend', 'stable')
        historical_context = f"Based on {len(raw_data)} records over the past month" if raw_data else "Limited data available"
        return f"📊 {historical_context}: {crop} in {district}, {state} - Current: ₹{current_price:.0f}, Trend: {trend}. Check multiple markets for best rates."

@router.get("/crop-insights/{user_id}")
async def get_crop_insights(
    user_id: str,
    crop: str,
    market_state: Optional[str] = None,
    market_district: Optional[str] = None,
    date: Optional[str] = None,
    date_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get market insights for a specific crop using real API data"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not market_state or not market_district:
            raise HTTPException(status_code=400, detail="Market state and district required")
        
        if not MARKET_PRICE_API_KEY:
            raise HTTPException(status_code=503, detail="Market API not configured")
        
        # Enhanced data fetching with month-long historical context
        from datetime import datetime, timedelta
        
        df = None
        data_source = "unknown"
        
        # Always try to get month-long data for better AI insights
        today = datetime.now()
        month_ago = today - timedelta(days=30)
        
        # First, try to get comprehensive monthly data
        monthly_data = []
        for days_back in range(0, 31, 3):  # Sample every 3 days for past month
            sample_date = (today - timedelta(days=days_back)).strftime('%d/%m/%Y')
            params = {
                "api-key": MARKET_PRICE_API_KEY,
                "format": "csv",
                "filters[State]": market_state,
                "filters[District]": market_district,
                "filters[Commodity]": crop,
                "filters[Arrival_Date]": sample_date,
                "limit": 20
            }
            
            try:
                response = requests.get(MARKET_PRICE_API_URL, params=params, timeout=10)
                if response.status_code == 200:
                    day_df = pd.read_csv(StringIO(response.text))
                    if not day_df.empty:
                        monthly_data.append(day_df)
            except:
                continue
        
        if monthly_data:
            df = pd.concat(monthly_data, ignore_index=True)
            data_source = "monthly_historical_data"
        
        # If we don't have monthly data yet, try the original date-specific logic
        if df is None or df.empty:
            if date_type in ['week', 'month'] and start_date and end_date:
                # Handle date range - get data for multiple days and aggregate
                from datetime import datetime, timedelta
                
                start_dt = datetime.strptime(start_date, '%d/%m/%Y')
                end_dt = datetime.strptime(end_date, '%d/%m/%Y')
                
                all_data = []
                current_date = start_dt
                
                while current_date <= end_dt:
                    date_str = current_date.strftime('%d/%m/%Y')
                    params = {
                        "api-key": MARKET_PRICE_API_KEY,
                        "format": "csv",
                        "filters[State]": market_state,
                        "filters[District]": market_district,
                        "filters[Commodity]": crop,
                        "filters[Arrival_Date]": date_str,
                        "limit": 50
                    }
                    
                    try:
                        response = requests.get(MARKET_PRICE_API_URL, params=params, timeout=15)
                        if response.status_code == 200:
                            day_df = pd.read_csv(StringIO(response.text))
                            if not day_df.empty:
                                all_data.append(day_df)
                    except:
                        pass
                    
                    current_date += timedelta(days=1)
                
                if all_data:
                    if df is None or df.empty:
                        df = pd.concat(all_data, ignore_index=True)
                        data_source = f"{date_type}_range_{start_date}_to_{end_date}"
                    else:
                        # Merge with existing monthly data
                        additional_df = pd.concat(all_data, ignore_index=True)
                        df = pd.concat([df, additional_df], ignore_index=True).drop_duplicates()
                        data_source += f"_plus_{date_type}_range"
            elif date and (df is None or df.empty):
                # Use specific date provided by user only if no monthly data
                params = {
                    "api-key": MARKET_PRICE_API_KEY,
                    "format": "csv",
                    "filters[State]": market_state,
                    "filters[District]": market_district,
                    "filters[Commodity]": crop,
                    "filters[Arrival_Date]": date,
                    "limit": 10
                }
                
                try:
                    response = requests.get(MARKET_PRICE_API_URL, params=params, timeout=15)
                    if response.status_code == 200:
                        specific_df = pd.read_csv(StringIO(response.text))
                        if not specific_df.empty:
                            if df is None or df.empty:
                                df = specific_df
                                data_source = f"specific_date_{date}"
                            else:
                                df = pd.concat([df, specific_df], ignore_index=True).drop_duplicates()
                                data_source += f"_plus_specific_date"
                except:
                    pass
        # Additional fallback only if we still don't have data
        if df is None or df.empty:
            # Fallback to original multiple date strategy
            date_formats_to_try = [
                # Format 1: DD/MM/YYYY
                today.strftime('%d/%m/%Y'),
                (today - timedelta(days=1)).strftime('%d/%m/%Y'),
                (today - timedelta(days=7)).strftime('%d/%m/%Y'),
                (today - timedelta(days=30)).strftime('%d/%m/%Y'),
                # Format 2: YYYY-MM-DD
                today.strftime('%Y-%m-%d'),
                (today - timedelta(days=1)).strftime('%Y-%m-%d'),
                (today - timedelta(days=7)).strftime('%Y-%m-%d'),
                (today - timedelta(days=30)).strftime('%Y-%m-%d'),
                # Format 3: DD-MM-YYYY
                today.strftime('%d-%m-%Y'),
                (today - timedelta(days=1)).strftime('%d-%m-%Y'),
                (today - timedelta(days=7)).strftime('%d-%m-%Y'),
                (today - timedelta(days=30)).strftime('%d-%m-%Y')
            ]
            
            # Try with recent dates first
            for date_str in date_formats_to_try:
                params = {
                    "api-key": MARKET_PRICE_API_KEY,
                    "format": "csv",
                    "filters[State]": market_state,
                    "filters[District]": market_district,
                    "filters[Commodity]": crop,
                    "filters[Arrival_Date]": date_str,
                    "limit": 10
                }
                
                try:
                    response = requests.get(MARKET_PRICE_API_URL, params=params, timeout=15)
                    if response.status_code == 200:
                        test_df = pd.read_csv(StringIO(response.text))
                        if not test_df.empty:
                            df = test_df
                            data_source = f"recent_data_{date_str}"
                            break
                except:
                    continue
        
        # If no recent data found, try without date filter
        if df is None or df.empty:
            params = {
                "api-key": MARKET_PRICE_API_KEY,
                "format": "csv",
                "filters[State]": market_state,
                "filters[District]": market_district,
                "filters[Commodity]": crop,
                "limit": 10
            }
            
            response = requests.get(MARKET_PRICE_API_URL, params=params, timeout=15)
            if response.status_code == 200:
                df = pd.read_csv(StringIO(response.text))
                if not df.empty:
                    data_source = "historical_data"
        
        if df is None or df.empty:
            return {
                "summary": f"No market data found for {crop} in {market_district}, {market_state}",
                "insights": {},
                "location": f"{market_district}, {market_state}",
                "raw_data": []
            }
        
        # Process and analyze the real data
        raw_data = []
        prices = []
        
        for _, row in df.iterrows():
            modal_price = row.get("Modal_Price")
            if pd.notna(modal_price):
                try:
                    price = float(modal_price)
                    prices.append(price)
                    raw_data.append({
                        "date": row.get("Arrival_Date", ""),
                        "market": row.get("Market", ""),
                        "commodity": row.get("Commodity", ""),
                        "variety": row.get("Variety", ""),
                        "modal_price": price,
                        "min_price": float(row.get("Min_Price", price)) if pd.notna(row.get("Min_Price")) else price,
                        "max_price": float(row.get("Max_Price", price)) if pd.notna(row.get("Max_Price")) else price
                    })
                except (ValueError, TypeError):
                    continue
        
        if not prices:
            return {
                "summary": f"No valid price data found for {crop} in {market_district}, {market_state}",
                "insights": {},
                "location": f"{market_district}, {market_state}",
                "raw_data": []
            }
        
        # Enhanced price analysis with historical context
        current_price = prices[-1] if prices else 0
        avg_price = sum(prices) / len(prices) if prices else 0
        min_price = min(prices) if prices else 0
        max_price = max(prices) if prices else 0
        
        # Enhanced trend analysis using more data points
        trend = "stable"
        price_change = 0
        
        if len(prices) >= 3:
            # Use recent vs older average for better trend detection
            recent_count = min(5, len(prices) // 2)
            recent_avg = sum(prices[-recent_count:]) / recent_count
            older_avg = sum(prices[:recent_count]) / recent_count if len(prices) >= recent_count * 2 else sum(prices[:-recent_count]) / (len(prices) - recent_count)
            
            price_change = recent_avg - older_avg
            price_change_percent = (price_change / older_avg) * 100 if older_avg > 0 else 0
            
            if price_change_percent > 8:
                trend = "rising"
            elif price_change_percent < -8:
                trend = "falling"
            else:
                trend = "stable"
        elif len(prices) >= 2:
            price_change = prices[-1] - prices[0]
            price_change_percent = (price_change / prices[0]) * 100 if prices[0] > 0 else 0
            
            if abs(price_change_percent) > 10:
                trend = "rising" if price_change > 0 else "falling"
            else:
                trend = "stable"
        
        # Simple price assessment farmers can understand
        if current_price > avg_price * 1.1:
            price_status = "Good Price"
            advice = "Fair deal - reasonable to sell locally"
        elif current_price > avg_price * 0.9:
            price_status = "Average Price"
            advice = "Check nearby markets for better rates"
        else:
            price_status = "Low Price"
            advice = "Shop around - might find better prices elsewhere"
        
        # Calculate potential earnings for farmer's understanding
        price_per_kg = current_price / 100 if current_price > 0 else 0  # Convert quintal to kg
        
        # Practical insights farmers actually need
        market_insight = {
            "transport_threshold": max(50, current_price * 0.02),  # 2% or ₹50 minimum worth traveling for
            "price_per_kg": price_per_kg,
            "is_fair_deal": current_price >= avg_price * 0.95
        }
        
        # Enhanced insights with historical context
        insights = {
            crop: {
                "latest_price": current_price,
                "price_change": price_change,
                "avg_price": avg_price,
                "min_price": min_price,
                "max_price": max_price,
                "current_price_per_quintal": current_price,
                "current_price_per_kg": price_per_kg,
                "typical_price_range": f"₹{min_price:.0f} - ₹{max_price:.0f}",
                "price_status": price_status,
                "practical_advice": advice,
                "is_fair_deal": market_insight["is_fair_deal"],
                "worth_traveling_if_difference_above": market_insight["transport_threshold"],
                "trend": trend,
                "data_points": len(prices),
                "historical_data_available": len(raw_data),
                "price_volatility": "high" if (max_price - min_price) / avg_price > 0.3 else "moderate" if (max_price - min_price) / avg_price > 0.15 else "low",
                "market_confidence": "high" if len(raw_data) >= 10 else "moderate" if len(raw_data) >= 5 else "low"
            }
        }
        
        # Add data source info to insights
        insights[crop]["data_source"] = data_source
        
        # Generate AI summary using DeepSeek model
        summary = await generate_ai_market_analysis(crop, market_district, market_state, raw_data, insights[crop])
        
        return {
            "summary": summary,
            "insights": insights,
            "location": f"{market_district}, {market_state}",
            "raw_data": raw_data[:15],  # Return up to 15 records for better context
            "data_source": data_source,
            "total_records": len(raw_data),
            "analysis_period": "past_month" if "monthly" in data_source else "recent_days",
            "data_quality": "excellent" if len(raw_data) >= 15 else "good" if len(raw_data) >= 8 else "limited"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating crop insights: {str(e)}")

@router.get("/states-districts")
async def get_all_states_districts():
    """Get all states with their districts by scraping the complete API dataset"""
    if not MARKET_PRICE_API_KEY:
        raise HTTPException(status_code=503, detail="Market API not configured")
    
    try:
        # Try to get maximum data with high limit
        params = {
            "api-key": MARKET_PRICE_API_KEY,
            "format": "csv",
            "limit": 100000  # Try to get all data at once
        }
        
        response = requests.get(MARKET_PRICE_API_URL, params=params, timeout=30)
        if response.status_code != 200:
            # Fallback: try with smaller limit and pagination
            all_data = []
            for offset in range(0, 10000, 10):  # Scrape systematically
                params = {
                    "api-key": MARKET_PRICE_API_KEY,
                    "format": "csv",
                    "offset": offset,
                    "limit": 10
                }
                
                batch_response = requests.get(MARKET_PRICE_API_URL, params=params, timeout=15)
                if batch_response.status_code != 200:
                    break
                
                df = pd.read_csv(StringIO(batch_response.text))
                if df.empty or "State" not in df.columns or "District" not in df.columns:
                    break
                
                batch_data = df[["State", "District"]].dropna()
                if batch_data.empty or len(df) == 0:
                    break
                    
                all_data.append(batch_data)
                
                # Stop if we got less than expected (end of data)
                if len(df) < 10:
                    break
            
            if not all_data:
                raise HTTPException(status_code=503, detail="No data available from API")
            
            # Combine all scraped data
            df = pd.concat(all_data, ignore_index=True)
        else:
            # Process the single large response
            df = pd.read_csv(StringIO(response.text))
            if df.empty or "State" not in df.columns or "District" not in df.columns:
                raise HTTPException(status_code=503, detail="API data missing required columns")
        
        # Clean and process all scraped data
        clean_df = df[["State", "District"]].dropna().drop_duplicates()
        clean_df["State"] = clean_df["State"].str.strip()
        clean_df["District"] = clean_df["District"].str.strip()
        
        # Remove empty values
        clean_df = clean_df[(clean_df["State"] != "") & (clean_df["District"] != "")]
        
        # Group by state to create the final structure
        result = {}
        for state, group in clean_df.groupby("State"):
            districts = sorted(group["District"].unique().tolist())
            result[state] = districts
        
        states = sorted(list(result.keys()))
        
        return {
            "states_districts": result,
            "states": states,
            "total_states": len(result),
            "total_districts": sum(len(districts) for districts in result.values()),
            "total_records_processed": len(clean_df),
            "source": "api_scraped"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scraping data: {str(e)}")

@router.get("/user-commodities/{user_id}")
async def get_user_commodities(user_id: str, db: Session = Depends(get_db)):
    """Get commodities based on user's crops"""
    try:
        user_crops = db.query(Crop).filter(Crop.user_id == user_id).all()
        if not user_crops:
            return {"commodities": []}
        
        crop_names = [crop.name for crop in user_crops]
        return {"commodities": crop_names}
        
    except Exception as e:
        return {"commodities": []}





@router.post("/sync-to-db")
async def sync_states_districts_to_db(db: Session = Depends(get_db)):
    """Scrape and save all states and districts from API to database"""
    if not MARKET_PRICE_API_KEY:
        raise HTTPException(status_code=503, detail="Market API not configured")
    
    try:
        # Scrape all data using the same logic as states-districts endpoint
        params = {
            "api-key": MARKET_PRICE_API_KEY,
            "format": "csv",
            "limit": 100000
        }
        
        response = requests.get(MARKET_PRICE_API_URL, params=params, timeout=30)
        if response.status_code != 200:
            # Fallback scraping
            all_data = []
            for offset in range(0, 10000, 10):
                params = {
                    "api-key": MARKET_PRICE_API_KEY,
                    "format": "csv",
                    "offset": offset,
                    "limit": 10
                }
                
                batch_response = requests.get(MARKET_PRICE_API_URL, params=params, timeout=15)
                if batch_response.status_code != 200:
                    break
                
                df = pd.read_csv(StringIO(batch_response.text))
                if df.empty or "State" not in df.columns or "District" not in df.columns:
                    break
                
                all_data.append(df[["State", "District"]].dropna())
                
                if len(df) < 10:
                    break
            
            if not all_data:
                raise HTTPException(status_code=503, detail="No data available")
            
            df = pd.concat(all_data, ignore_index=True)
        else:
            df = pd.read_csv(StringIO(response.text))
            if df.empty or "State" not in df.columns or "District" not in df.columns:
                raise HTTPException(status_code=503, detail="Invalid data")
        
        # Clean and process scraped data
        clean_df = df[["State", "District"]].dropna().drop_duplicates()
        clean_df["State"] = clean_df["State"].str.strip()
        clean_df["District"] = clean_df["District"].str.strip()
        clean_df = clean_df[(clean_df["State"] != "") & (clean_df["District"] != "")]
        
        saved_count = 0
        for _, row in clean_df.iterrows():
            state, district = row["State"], row["District"]
            
            if not db.query(District).filter(
                District.name == district, District.state == state
            ).first():
                db.add(District(name=district, state=state))
                saved_count += 1
        
        db.commit()
        
        return {
            "message": f"Scraped and saved {saved_count} new districts from API",
            "saved_count": saved_count,
            "total_records_processed": len(clean_df),
            "total_states": db.query(District.state).distinct().count(),
            "total_districts": db.query(District).count()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error syncing: {str(e)}")

@router.get("/db-status")
async def get_db_status(db: Session = Depends(get_db)):
    """View what's stored in database"""
    districts = db.query(District).all()
    
    if not districts:
        return {"message": "Database is empty", "total_states": 0, "total_districts": 0, "data": {}}
    
    result = {}
    for district in districts:
        if district.state not in result:
            result[district.state] = []
        result[district.state].append(district.name)
    
    for state in result:
        result[state] = sorted(result[state])
    
    return {
        "total_states": len(result),
        "total_districts": len(districts),
        "data": result
    }

@router.get("/states-districts-db")
async def get_states_districts_from_db(db: Session = Depends(get_db)):
    """Get all states with their districts from database for frontend dropdowns"""
    try:
        districts = db.query(District).order_by(District.state, District.name).all()
        
        if not districts:
            return {"states_districts": {}, "states": [], "total_states": 0, "total_districts": 0}
        
        result = {}
        for district in districts:
            if district.state not in result:
                result[district.state] = []
            result[district.state].append(district.name)
        
        states = sorted(list(result.keys()))
        
        return {
            "states_districts": result,
            "states": states,
            "total_states": len(result),
            "total_districts": len(districts),
            "source": "database"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching from database: {str(e)}")

@router.delete("/clear-districts")
async def clear_all_districts(db: Session = Depends(get_db)):
    """Delete all stored districts from database"""
    deleted_count = db.query(District).count()
    db.query(District).delete()
    db.commit()
    return {"message": f"Deleted {deleted_count} districts", "deleted_count": deleted_count}