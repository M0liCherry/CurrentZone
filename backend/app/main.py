import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed_data import seed_initial_data
from app.routers import (
    telemetry,
    predictor,
    usage,
    insights,
    billing,
    budgets,
    devices,
    notifications,
    auth
)

# Ensure schema and initial seed data exist
Base.metadata.create_all(bind=engine)
with SessionLocal() as _init_db:
    seed_initial_data(_init_db)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure DB schema and seed data
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_initial_data(db)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SmartWatt Backend - Electricity Outage Predictor with ESP32 SCT-013 Telemetry Ingestion, Transformer Thermal Analysis, and Machine Learning Failure Forecasting.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(telemetry.router, prefix=settings.API_V1_STR)
app.include_router(predictor.router, prefix=settings.API_V1_STR)
app.include_router(usage.router, prefix=settings.API_V1_STR)
app.include_router(insights.router, prefix=settings.API_V1_STR)
app.include_router(billing.router, prefix=settings.API_V1_STR)
app.include_router(budgets.router, prefix=settings.API_V1_STR)
app.include_router(devices.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)

# Mount uploads directory for bill image previews
uploads_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "endpoints": {
            "telemetry_ingest": "/api/telemetry/ingest",
            "outage_predictor_overview": "/api/predictor/overview",
            "outage_zones": "/api/predictor/zones",
            "scenario_simulation": "/api/predictor/simulate",
            "usage_daily": "/api/usage/daily",
            "usage_weekly": "/api/usage/weekly",
            "usage_monthly": "/api/usage/monthly",
            "insights_bedroom": "/api/insights/bedroom",
            "billing_summary": "/api/billing/summary",
            "budgets": "/api/budgets",
            "devices": "/api/devices",
            "notifications": "/api/notifications",
            "auth_me": "/api/auth/me"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
