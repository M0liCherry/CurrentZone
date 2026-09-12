from fastapi import APIRouter
from app.schemas.billing import BillingSummaryResponse
from app.services.grid_analytics import grid_analytics

router = APIRouter(prefix="/billing", tags=["Billing & Cost Estimation"])

@router.get("/summary", response_model=BillingSummaryResponse)
def get_billing_summary():
    """
    Returns billing and cost estimation overview matching SmartWatt 'Cost Estimation.png':
    - Current Bill: Estimated $123.50, Due Oct 15
    - Past Bills: Oct 2023 $150.20, Sep 2023 $135.75, Aug 2023 $160.40
    - Savings: Estimated $20.00 This Month
    - Switch to Green Energy promo
    """
    return grid_analytics.get_billing_summary()
