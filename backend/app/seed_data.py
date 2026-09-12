import datetime
from sqlalchemy.orm import Session
from app.models.grid import Transformer
from app.models.user import User, BudgetAlert

def seed_initial_data(db: Session):
    """
    Populates the database with grid substation topology, default user account,
    and initial zero-usage budget. All device telemetry, load, and consumption
    are populated dynamically from real ESP32 or external sensor streams.
    """
    # 1. Check if already seeded
    if db.query(Transformer).first():
        return

    # 2. Seed Distribution Transformer for connected ESP32 sensor
    transformers = [
        Transformer(
            id="TX-RES-01",
            name="Residential Feeder Substation TX-101",
            zone="Residential South",
            rated_kva=100.0,
            nominal_voltage=230.0,
            latitude=35.4676,
            longitude=-97.5164,
            installation_year=2016,
            health_score=100.0,
            current_top_oil_temp=25.0
        )
    ]
    db.add_all(transformers)
    db.commit()

    # 3. Seed Default User Account
    user = User(
        id=1,
        username="leslie294",
        email="leslie@gmail.com",
        full_name="Leslie Raymond",
        phone="(405) 439 - 3985",
        birthday="July 17, 1989",
        hashed_password="hashed_demo_password_123"
    )
    db.add(user)
    db.commit()

    # 4. Seed Clean Initial Budget with 0.0 current spend
    budget = BudgetAlert(
        user_id=1,
        monthly_budget_usd=150.0,
        target_kwh=450.0,
        alert_threshold_pct=80.0,
        current_spent_usd=0.0,
        is_active=True
    )
    db.add(budget)
    db.commit()
