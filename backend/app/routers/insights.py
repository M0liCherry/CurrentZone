from fastapi import APIRouter
from app.schemas.usage import BedroomEnergyOverviewResponse
from app.services.grid_analytics import grid_analytics

router = APIRouter(prefix="/insights", tags=["Appliance Insights"])

@router.get("/bedroom", response_model=BedroomEnergyOverviewResponse)
def get_bedroom_insights():
    """
    Returns Bedroom Energy Consumption Overview matching SmartWatt 'Insight.png':
    - Total: 120 kWh (+15%)
    - Peak: 50 kWh (-10%)
    - Plugs: Light A, Fan, AC
    - Detailed breakdowns: AC 45 kWh (37.5%), Fan 30 kWh (25%), Light 25 kWh (20.8%)
    - Rating: 4.5 / 120 reviews
    """
    return grid_analytics.get_bedroom_insights()
