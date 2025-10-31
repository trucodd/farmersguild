# Farmers Guild

AI-powered agricultural platform for crop management, disease detection, and market intelligence.

## Features

- **Crop Management**: Track crops with AI-powered context and guidance
- **Disease Detection**: Upload photos for instant AI disease analysis
- **Market Intelligence**: Real-time price data with AI recommendations
- **Weather Integration**: Location-based forecasts
- **Cost Tracking**: Expense analysis and optimization
- **AI Chat**: Crop-specific farming advice

## Tech Stack

- **Frontend**: React + Vite, TailwindCSS
- **Backend**: FastAPI, PostgreSQL, LangChain
- **AI**: OpenRouter (Grok, DeepSeek), Computer Vision
- **Infrastructure**: Docker, Docker Compose



### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd farmersguild
```

2. **Environment Configuration**
```bash
cp .env.example .env
```

Edit `.env` with your API keys:
```bash
OPENROUTER_API_KEY=your_openrouter_key
MARKET_PRICE_API_KEY=your_market_key
OPENWEATHER_API_KEY=your_weather_key
DATABASE_URL=postgresql://user:password@db:5432/farmersguild
SECRET_KEY=your_jwt_secret
```

3. **Start the application**
```bash
docker-compose up -d
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Development Setup

### Backend Development
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```




## Docker Services

- **frontend**: React application (port 3000)
- **backend**: FastAPI server (port 8000)
- **db**: PostgreSQL database (port 5432)

## Project Structure

```
farmersguild/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Page components
│   │   └── utils/      # API utilities
├── backend/            # FastAPI backend
│   ├── routers/        # API endpoints
│   ├── ai/             # AI services
│   └── models.py       # Database models
├── docker-compose.yml  # Docker services
└── .env.example        # Environment template
```

