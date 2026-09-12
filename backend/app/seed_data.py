import datetime
from sqlalchemy.orm import Session
from app.models.grid import Transformer, HistoricalOutage, WeatherRecord
from app.models.user import User, Device, BudgetAlert, BillRecord, Notification

def seed_initial_data(db: Session):
    """
    Populates the database with realistic grid topology, transformers, 
    historical failure incident logs, and the default SmartWatt user account.
    """
    # 1. Check if already seeded
    if db.query(Transformer).first():
        return

    # 2. Seed Distribution Transformers
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
            health_score=88.5,
            current_top_oil_temp=52.0
        ),
        Transformer(
            id="TX-COM-02",
            name="Downtown Commercial Center TX-204",
            zone="Downtown District",
            rated_kva=250.0,
            nominal_voltage=230.0,
            latitude=35.4720,
            longitude=-97.5190,
            installation_year=2019,
            health_score=94.0,
            current_top_oil_temp=48.0
        ),
        Transformer(
            id="TX-IND-03",
            name="Industrial Sector Feeder TX-308",
            zone="Industrial North",
            rated_kva=500.0,
            nominal_voltage=230.0,
            latitude=35.4850,
            longitude=-97.5100,
            installation_year=2012,
            health_score=78.0,
            current_top_oil_temp=68.0
        ),
        Transformer(
            id="TX-SUB-04",
            name="Suburban West Feeder TX-412",
            zone="Suburban West",
            rated_kva=75.0,
            nominal_voltage=230.0,
            latitude=35.4600,
            longitude=-97.5350,
            installation_year=2021,
            health_score=97.0,
            current_top_oil_temp=42.0
        )
    ]
    db.add_all(transformers)
    db.commit()

    # 3. Seed Historical Outages Database
    now = datetime.datetime.utcnow()
    outages = [
        HistoricalOutage(
            timestamp=now - datetime.timedelta(days=14),
            duration_minutes=185,
            zone="Industrial North",
            transformer_id="TX-IND-03",
            root_cause="Thermal Overload",
            peak_temperature_c=41.2,
            wind_gust_kmh=24.0,
            load_pct_at_failure=128.4,
            customers_affected=320
        ),
        HistoricalOutage(
            timestamp=now - datetime.timedelta(days=28),
            duration_minutes=95,
            zone="Residential South",
            transformer_id="TX-RES-01",
            root_cause="Wind Gust / Feeder Snap",
            peak_temperature_c=29.0,
            wind_gust_kmh=68.5,
            load_pct_at_failure=82.0,
            customers_affected=180
        ),
        HistoricalOutage(
            timestamp=now - datetime.timedelta(days=45),
            duration_minutes=140,
            zone="Suburban West",
            transformer_id="TX-SUB-04",
            root_cause="Lightning Strike",
            peak_temperature_c=26.5,
            wind_gust_kmh=52.0,
            load_pct_at_failure=74.5,
            customers_affected=110
        ),
        HistoricalOutage(
            timestamp=now - datetime.timedelta(days=62),
            duration_minutes=210,
            zone="Residential South",
            transformer_id="TX-RES-01",
            root_cause="Thermal Overload",
            peak_temperature_c=39.8,
            wind_gust_kmh=18.0,
            load_pct_at_failure=122.1,
            customers_affected=195
        )
    ]
    db.add_all(outages)

    # 4. Seed SmartWatt Default User (Leslie Raymond)
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

    # 5. Seed User's Smart Plugs & Devices
    devices = [
        Device(
            id="plug_smart_fridge_01",
            user_id=1,
            name="Smart Fridge",
            device_type="smart_plug",
            room="Kitchen",
            zone="Residential South",
            transformer_id="TX-RES-01",
            is_online=True,
            current_power_w=185.0,
            current_amps=0.82,
            daily_kwh=4.4
        ),
        Device(
            id="plug_smart_tv_02",
            user_id=1,
            name="Smart TV",
            device_type="smart_plug",
            room="Living Room",
            zone="Residential South",
            transformer_id="TX-RES-01",
            is_online=True,
            current_power_w=120.0,
            current_amps=0.53,
            daily_kwh=1.8
        ),
        Device(
            id="plug_smart_lamp_03",
            user_id=1,
            name="Smart Lamp",
            device_type="smart_plug",
            room="Bedroom",
            zone="Residential South",
            transformer_id="TX-RES-01",
            is_online=True,
            current_power_w=25.0,
            current_amps=0.11,
            daily_kwh=0.3
        ),
        Device(
            id="plug_ac_unit_04",
            user_id=1,
            name="A.C.",
            device_type="smart_plug",
            room="Bedroom",
            zone="Residential South",
            transformer_id="TX-RES-01",
            is_online=True,
            current_power_w=1850.0,
            current_amps=8.2,
            daily_kwh=14.5
        ),
        Device(
            id="esp32_sct013_res_01",
            user_id=1,
            name="ESP32 SCT-013 Transformer Monitor",
            device_type="transformer_monitor",
            room="Main Breaker / Feeder",
            zone="Residential South",
            transformer_id="TX-RES-01",
            is_online=True,
            current_power_w=9850.0,
            current_amps=42.8,
            daily_kwh=68.2
        )
    ]
    db.add_all(devices)

    # 6. Seed Bills
    bills = [
        BillRecord(user_id=1, month_label="Oct 2023", amount_usd=150.20, due_date="Nov 15", status="Paid", energy_kwh=395.0, savings_usd=18.0),
        BillRecord(user_id=1, month_label="Sep 2023", amount_usd=135.75, due_date="Oct 15", status="Paid", energy_kwh=360.0, savings_usd=22.5),
        BillRecord(user_id=1, month_label="Aug 2023", amount_usd=160.40, due_date="Sep 15", status="Paid", energy_kwh=430.0, savings_usd=15.0)
    ]
    db.add_all(bills)

    # 7. Seed Budget
    budget = BudgetAlert(
        user_id=1,
        monthly_budget_usd=150.0,
        target_kwh=450.0,
        alert_threshold_pct=80.0,
        current_spent_usd=123.50,
        is_active=True
    )
    db.add(budget)

    # 8. Seed Notifications matching Figma Notifications.png
    notifications = [
        Notification(
            user_id=1,
            title="Grid Outage Risk Warning",
            description="Transformer TX-101 approaching 89% load during severe heatwave. Potential outage risk elevated.",
            category="outage_alert",
            time_label="9:41 AM"
        ),
        Notification(
            user_id=1,
            title="Approaching Monthly Budget",
            description="You have reached $123.50 of your $150.00 monthly energy budget (82%).",
            category="budget",
            time_label="9:41 AM"
        ),
        Notification(
            user_id=1,
            title="Energy Saving Recommendation",
            description="Shifting AC cooling by 2°C between 6 PM - 9 PM can reduce bill by $18/mo.",
            category="energy_saving",
            time_label="9:41 AM"
        ),
        Notification(
            user_id=1,
            title="SCT-013 Sensor Connected",
            description="ESP32 Non-invasive CT monitor online and actively streaming telemetry.",
            category="device",
            time_label="9:41 AM"
        )
    ]
    db.add_all(notifications)
    db.commit()
