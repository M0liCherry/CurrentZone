from typing import List, Dict
from pydantic import BaseModel

class HourlySlot(BaseModel):
    time_label: str  # "12AM", "4AM", "8AM", "12PM", "4PM", "8PM"
    kwh: float

class DailyConsumptionResponse(BaseModel):
    title: str = "Daily Consumption"
    subtitle: str = "Today"
    slots: List[HourlySlot]
    average_daily_kwh: float
    average_change_pct: float
    compared_to_yesterday_kwh: float
    compared_to_yesterday_pct: float
    peak_window: str = "--"

class DaySlot(BaseModel):
    day: str  # "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
    kwh: float

class WeeklyConsumptionResponse(BaseModel):
    title: str = "Weekly Consumption"
    subtitle: str = "This Week"
    days: List[DaySlot]
    total_week_kwh: float

class MonthSlot(BaseModel):
    month: str  # "Jan", "Feb", "Mar", "Apr", "May", "Jun", etc.
    kwh: float

class MonthlyConsumptionResponse(BaseModel):
    title: str = "Monthly Consumption"
    subtitle: str = "Last 12 Months"
    months: List[MonthSlot]
    total_year_kwh: float

class PlugConsumptionItem(BaseModel):
    name: str  # "Light A", "Fan", "AC"
    kwh: float
    percentage: float
    is_peak: bool = False

class BedroomEnergyOverviewResponse(BaseModel):
    title: str = "Bedroom Energy Consumption Overview"
    total_kwh: float
    total_change_pct: float
    peak_kwh: float
    peak_change_pct: float
    plug_breakdown: List[PlugConsumptionItem]
    rating: float = 4.5
    reviews_count: int = 120
    star_distribution: Dict[str, float]
