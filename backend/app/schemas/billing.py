from typing import List, Optional
from pydantic import BaseModel

class CurrentBillItem(BaseModel):
    estimated_bill_usd: float
    due_date: str

class PastBillItem(BaseModel):
    month_year: str
    status: str
    amount_usd: float
    due_date: str

class BillingSummaryResponse(BaseModel):
    current_bill: CurrentBillItem
    past_bills: List[PastBillItem]
    estimated_savings_this_month_usd: float
    promo_title: str
    promo_description: str

class BudgetSettingsRequest(BaseModel):
    monthly_budget_usd: float
    target_kwh: Optional[float] = 450.0
    alert_threshold_pct: Optional[float] = 80.0

class BudgetSettingsResponse(BaseModel):
    monthly_budget_usd: float
    current_spent_usd: float
    remaining_budget_usd: float
    percentage_used: float
    alert_triggered: bool
    status: str
