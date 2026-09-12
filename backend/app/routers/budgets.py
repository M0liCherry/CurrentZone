from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import BudgetAlert
from app.schemas.billing import BudgetSettingsRequest, BudgetSettingsResponse

router = APIRouter(prefix="/budgets", tags=["Budgets & Alerts"])

@router.get("/", response_model=BudgetSettingsResponse)
def get_user_budget(db: Session = Depends(get_db)):
    """
    Returns user's current energy budget status matching SmartWatt 'Budget & Alerts.png'.
    """
    budget = db.query(BudgetAlert).filter(BudgetAlert.user_id == 1).first()
    if not budget:
        budget = BudgetAlert(
            user_id=1,
            monthly_budget_usd=150.0,
            current_spent_usd=123.50,
            alert_threshold_pct=80.0
        )
        db.add(budget)
        db.commit()
        
    spent = budget.current_spent_usd
    total = budget.monthly_budget_usd
    rem = max(0.0, total - spent)
    pct = round((spent / total) * 100.0, 1) if total > 0 else 0.0
    
    return BudgetSettingsResponse(
        monthly_budget_usd=total,
        current_spent_usd=spent,
        remaining_budget_usd=round(rem, 2),
        percentage_used=pct,
        alert_triggered=pct >= budget.alert_threshold_pct,
        status="APPROACHING_LIMIT" if pct >= budget.alert_threshold_pct else "ON_TRACK"
    )

@router.post("/", response_model=BudgetSettingsResponse)
def update_user_budget(payload: BudgetSettingsRequest, db: Session = Depends(get_db)):
    """
    Updates user's monthly budget limit.
    """
    budget = db.query(BudgetAlert).filter(BudgetAlert.user_id == 1).first()
    if not budget:
        budget = BudgetAlert(user_id=1)
        db.add(budget)
        
    budget.monthly_budget_usd = payload.monthly_budget_usd
    if payload.target_kwh:
        budget.target_kwh = payload.target_kwh
    if payload.alert_threshold_pct:
        budget.alert_threshold_pct = payload.alert_threshold_pct
        
    db.commit()
    db.refresh(budget)
    
    spent = budget.current_spent_usd
    total = budget.monthly_budget_usd
    rem = max(0.0, total - spent)
    pct = round((spent / total) * 100.0, 1) if total > 0 else 0.0
    
    return BudgetSettingsResponse(
        monthly_budget_usd=total,
        current_spent_usd=spent,
        remaining_budget_usd=round(rem, 2),
        percentage_used=pct,
        alert_triggered=pct >= budget.alert_threshold_pct,
        status="APPROACHING_LIMIT" if pct >= budget.alert_threshold_pct else "ON_TRACK"
    )
