from typing import List, Optional
from pydantic import BaseModel

class CurrentBillItem(BaseModel):
    estimated_bill_usd: float
    due_date: str
    projected_kwh: Optional[float] = 0.0
    kwh_so_far: Optional[float] = 0.0
    rate_per_kwh: Optional[float] = 0.15
    fixed_charges: Optional[float] = 0.0
    tax_amount: Optional[float] = 0.0
    tariff_source: Optional[str] = "Standard Tariff"
    days_elapsed: Optional[int] = 1
    days_remaining: Optional[int] = 29

class PastBillItem(BaseModel):
    id: Optional[int] = None
    month_year: str
    status: str
    amount_usd: float
    due_date: str
    energy_kwh: Optional[float] = 0.0
    rate_per_kwh: Optional[float] = 0.15
    fixed_charges: Optional[float] = 0.0
    image_path: Optional[str] = None

class BillingSummaryResponse(BaseModel):
    current_bill: CurrentBillItem
    past_bills: List[PastBillItem]
    estimated_savings_this_month_usd: float
    promo_title: str
    promo_description: str

class BillExtractionResponse(BaseModel):
    success: bool
    month_label: str
    energy_kwh: float
    amount_usd: float
    rate_per_kwh: float
    fixed_charges: float
    tax_amount: float
    due_date: str
    account_number: Optional[str] = None
    provider: Optional[str] = None
    image_path: Optional[str] = None
    raw_text_snippet: Optional[str] = None

class SaveBillRecordRequest(BaseModel):
    month_label: str
    amount_usd: float
    energy_kwh: float
    rate_per_kwh: float
    fixed_charges: Optional[float] = 0.0
    tax_amount: Optional[float] = 0.0
    due_date: str
    status: Optional[str] = "Paid"
    image_path: Optional[str] = None

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
