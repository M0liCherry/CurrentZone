from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.usage import DailyConsumptionResponse, WeeklyConsumptionResponse, MonthlyConsumptionResponse
from app.services.grid_analytics import grid_analytics

router = APIRouter(prefix="/usage", tags=["Usage Monitoring"])

@router.get("/daily", response_model=DailyConsumptionResponse)
def get_daily_usage(db: Session = Depends(get_db)):
    """
    Returns daily consumption breakdown from actual telemetry readings (Today: 12AM, 4AM, 8AM, 12PM, 4PM, 8PM).
    """
    return grid_analytics.get_daily_consumption(db)

@router.get("/weekly", response_model=WeeklyConsumptionResponse)
def get_weekly_usage(db: Session = Depends(get_db)):
    """
    Returns weekly consumption breakdown from actual telemetry readings (Mon to Sun).
    """
    return grid_analytics.get_weekly_consumption(db)

@router.get("/monthly", response_model=MonthlyConsumptionResponse)
def get_monthly_usage(db: Session = Depends(get_db)):
    """
    Returns 12-month consumption curve from actual telemetry readings.
    """
    return grid_analytics.get_monthly_consumption(db)

