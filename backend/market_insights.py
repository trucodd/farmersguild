import requests
import pandas as pd
from datetime import datetime, timedelta
from io import StringIO
from typing import List, Dict, Optional
import os
from openai import OpenAI
from location_matcher import LocationMatcher

class MarketInsightsService:
    def __init__(self):
        self.api_key = os.getenv("MARKET_PRICE_API_KEY")
        self.api_url = os.getenv("MARKET_PRICE_API_URL", "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24")
        self.openai_client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY")
        )
        self.location_matcher = LocationMatcher()
    
    def find_nearby_markets(self, user_state: str, user_district: str, crops: List[str]) -> List[Dict]:
        """Find markets that have data for user's crops"""
        markets = []
        
        for crop in crops:
            params = {
                "api-key": self.api_key,
                "format": "csv",
                "filters[Commodity]": crop,
                "limit": 5000
            }
            
            try:
                response = requests.get(self.api_url, params=params, timeout=30)
                if response.status_code == 200:
                    df = pd.read_csv(StringIO(response.text))
                    if not df.empty:
                        # Prioritize same state, then nearby states
                        state_markets = df[df['State'] == user_state]
                        if not state_markets.empty:
                            for _, row in state_markets.groupby(['State', 'District']).first().iterrows():
                                markets.append({
                                    'state': row['State'],
                                    'district': row['District'],
                                    'crop': crop,
                                    'priority': 1  # Same state
                                })
                        else:
                            # Add other states as backup
                            for _, row in df.groupby(['State', 'District']).first().head(3).iterrows():
                                markets.append({
                                    'state': row['State'],
                                    'district': row['District'], 
                                    'crop': crop,
                                    'priority': 2  # Other states
                                })
            except Exception:
                continue
        
        # Remove duplicates and sort by priority
        unique_markets = {}
        for market in markets:
            key = f"{market['state']}-{market['district']}"
            if key not in unique_markets or market['priority'] < unique_markets[key]['priority']:
                unique_markets[key] = market
        
        return sorted(unique_markets.values(), key=lambda x: x['priority'])
    
    def get_price_data(self, state: str, district: str, crops: List[str], days: int = 7) -> pd.DataFrame:
        """Fetch price data for specific market and crops"""
        to_date = datetime.now().strftime("%Y-%m-%d")
        from_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        all_data = []
        for crop in crops:
            params = {
                "api-key": self.api_key,
                "format": "csv",
                "filters[State]": state,
                "filters[District]": district,
                "filters[Commodity]": crop,
                "filters[Arrival_Date][from]": from_date,
                "filters[Arrival_Date][to]": to_date,
                "limit": 1000
            }
            
            try:
                response = requests.get(self.api_url, params=params, timeout=30)
                if response.status_code == 200:
                    df = pd.read_csv(StringIO(response.text))
                    if not df.empty:
                        all_data.append(df)
            except Exception:
                continue
        
        return pd.concat(all_data, ignore_index=True) if all_data else pd.DataFrame()
    
    def analyze_price_trends(self, df: pd.DataFrame) -> Dict:
        """Analyze price trends and patterns"""
        if df.empty:
            return {"error": "No data available"}
        
        # Clean and process data
        df['Modal_Price'] = pd.to_numeric(df['Modal_Price'], errors='coerce')
        df['Arrival_Date'] = pd.to_datetime(df['Arrival_Date'], errors='coerce')
        df = df.dropna(subset=['Modal_Price', 'Arrival_Date'])
        
        insights = {}
        
        for commodity in df['Commodity'].unique():
            crop_data = df[df['Commodity'] == commodity].sort_values('Arrival_Date')
            
            if len(crop_data) < 2:
                continue
                
            latest_price = crop_data['Modal_Price'].iloc[-1]
            previous_price = crop_data['Modal_Price'].iloc[-2] if len(crop_data) > 1 else latest_price
            price_change = latest_price - previous_price
            price_change_pct = (price_change / previous_price * 100) if previous_price > 0 else 0
            
            avg_price = crop_data['Modal_Price'].mean()
            min_price = crop_data['Modal_Price'].min()
            max_price = crop_data['Modal_Price'].max()
            
            insights[commodity] = {
                "latest_price": float(latest_price),
                "previous_price": float(previous_price),
                "price_change": float(price_change),
                "price_change_pct": float(price_change_pct),
                "avg_price": float(avg_price),
                "min_price": float(min_price),
                "max_price": float(max_price),
                "trend": "rising" if price_change > 0 else "falling" if price_change < 0 else "stable",
                "volatility": "high" if (max_price - min_price) / avg_price > 0.2 else "low",
                "data_points": len(crop_data)
            }
        
        return insights
    
    def generate_ai_summary(self, insights: Dict, user_crops: List[str]) -> str:
        """Generate AI-powered summary for farmers"""
        if not insights or "error" in insights:
            return "No recent market data available for your crops and location."
        
        prompt = f"""
        You are a farming advisor. Analyze this market data and provide a clear, actionable summary for a farmer.
        
        User's crops: {', '.join(user_crops)}
        Market data: {insights}
        
        Provide a friendly summary that includes:
        1. Current prices for their crops
        2. Recent price trends (up/down/stable)
        3. Simple advice on whether to sell now or wait
        4. Any notable market conditions
        
        Keep it conversational and easy to understand. Use emojis where appropriate.
        """
        
        try:
            response = self.openai_client.chat.completions.create(
                extra_headers={
                    "HTTP-Referer": "https://farmersguild.app",
                    "X-Title": "Farmers Guild"
                },
                model="deepseek/deepseek-chat-v3.1:free",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception:
            return self._generate_fallback_summary(insights)
    
    def _generate_fallback_summary(self, insights: Dict) -> str:
        """Generate basic summary without AI"""
        summary_parts = []
        
        for crop, data in insights.items():
            trend_emoji = "📈" if data["trend"] == "rising" else "📉" if data["trend"] == "falling" else "➡️"
            change_text = f"{data['price_change_pct']:.1f}%" if abs(data['price_change_pct']) > 0.1 else "stable"
            
            summary_parts.append(
                f"{trend_emoji} {crop}: ₹{data['latest_price']:.0f} ({change_text})"
            )
        
        return "Market Update:\n" + "\n".join(summary_parts)