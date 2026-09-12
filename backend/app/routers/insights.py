from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.usage import BedroomEnergyOverviewResponse
from app.services.grid_analytics import grid_analytics

router = APIRouter(prefix="/insights", tags=["Appliance Insights"])

@router.get("/bedroom", response_model=BedroomEnergyOverviewResponse)
def get_bedroom_insights(db: Session = Depends(get_db)):
    """
    Returns Appliance Energy Consumption Overview from real device telemetry.
    """
    return grid_analytics.get_bedroom_insights(db)

@router.get("/recommendations")
def get_energy_recommendations(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns dynamic energy-saving recommendations computed from real ESP32
    telemetry, active power factor, peak vs off-peak hours, and paired devices.
    """
    return grid_analytics.get_energy_recommendations(db)
