from fastapi import APIRouter
from app.schemas.usage import DailyConsumptionResponse, WeeklyConsumptionResponse, MonthlyConsumptionResponse
from app.services.grid_analytics import grid_analytics

router = APIRouter(prefix="/usage", tags=["Usage Monitoring"])

@router.get("/daily", response_model=DailyConsumptionResponse)
def get_daily_usage():
    """
    Returns daily consumption breakdown matching SmartWatt 'Usage Monitoring.png' (Today: 12AM, 4AM, 8AM, 12PM, 4PM, 8PM).
    Average Daily Use: 28 kWh (+20%), Compared to Yesterday (+5 kWh).
    """
    return grid_analytics.get_daily_consumption()

@router.get("/weekly", response_model=WeeklyConsumptionResponse)
def get_weekly_usage():
    """
    Returns weekly consumption breakdown matching SmartWatt 'Usage Monitoring.png' (Mon to Sun).
    """
    return grid_analytics.get_weekly_consumption()

@router.get("/monthly", response_model=MonthlyConsumptionResponse)
def get_monthly_usage():
    """
    Returns 12-month consumption curve matching SmartWatt 'Usage Monitoring.png'.
    """
    return grid_analytics.get_monthly_consumption()
