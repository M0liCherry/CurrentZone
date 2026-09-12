import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_and_health():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "SmartWatt" in data["service"]
    assert data["status"] == "online"
    
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"

def test_telemetry_ingest_sct013_nominal():
    # Ingest real telemetry from ESP32 SCT-013
    payload = {
        "device_id": "esp32_sct013_res_01",
        "transformer_id": "TX-RES-01",
        "current_rms": 42.5,
        "voltage_v": 230.0,
        "frequency_hz": 50.0,
        "energy_kwh_total": 12.4,
        "peak_surge_a": 48.0,
        "sample_count": 500
    }
    response = client.post("/api/telemetry/ingest", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["current_rms"] == 42.5
    assert data["risk_level"] in ["LOW", "MODERATE"]

def test_telemetry_ingest_sct013_severe_overload():
    # Ingest severe transformer overload from ESP32
    payload = {
        "device_id": "esp32_sct013_res_01",
        "transformer_id": "TX-RES-01",
        "current_rms": 135.0,
        "voltage_v": 230.0,
        "frequency_hz": 50.0,
        "energy_kwh_total": 210.0,
        "peak_surge_a": 165.0,
        "sample_count": 500
    }
    response = client.post("/api/telemetry/ingest", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["risk_level"] in ["HIGH", "CRITICAL"]
    assert data["failure_probability"] > 60.0

def test_predictor_overview_and_zones():
    response = client.get("/api/predictor/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["monitored_transformers_count"] >= 1
    assert "zones" in data
    
    zones_resp = client.get("/api/predictor/zones")
    assert zones_resp.status_code == 200
    zones = zones_resp.json()
    assert len(zones) >= 1
    for z in zones:
        assert "failure_probability_pct" in z
        assert "risk_level" in z
        assert "recommended_action" in z

def test_bill_confirm_and_prediction():
    confirm_resp = client.post("/api/billing/confirm-bill", json={
        "month_label": "Jul 2026",
        "amount_usd": 64.50,
        "energy_kwh": 350.0,
        "rate_per_kwh": 0.16,
        "fixed_charges": 8.50,
        "tax_amount": 3.20,
        "due_date": "Aug 15, 2026",
        "status": "Paid"
    })
    assert confirm_resp.status_code == 200
    data = confirm_resp.json()
    assert "current_bill" in data
    assert data["current_bill"]["rate_per_kwh"] == 0.16
    assert data["current_bill"]["fixed_charges"] == 8.50
    assert data["current_bill"]["estimated_bill_usd"] > 0
    assert len(data["past_bills"]) >= 1

def test_predictor_simulation_extreme_storm():
    scenario = {
        "zone": "Residential South",
        "transformer_id": "TX-RES-01",
        "current_rms": 115.0,
        "ambient_temp_c": 42.0,
        "wind_gust_kmh": 72.0,
        "rain_mm": 25.0,
        "lightning_index": 8.0
    }
    response = client.post("/api/predictor/simulate", json=scenario)
    assert response.status_code == 200
    result = response.json()
    assert result["risk_level"] in ["HIGH", "CRITICAL"]
    assert result["failure_probability_pct"] >= 75.0
    assert result["estimated_ttf_minutes"] is not None
    assert len(result["primary_factors"]) > 0

def test_usage_monitoring_screens():
    daily = client.get("/api/usage/daily")
    assert daily.status_code == 200
    daily_data = daily.json()
    assert "average_daily_kwh" in daily_data
    assert len(daily_data["slots"]) == 6  # 12AM, 4AM, 8AM, 12PM, 4PM, 8PM
    
    weekly = client.get("/api/usage/weekly")
    assert weekly.status_code == 200
    assert len(weekly.json()["days"]) == 7
    
    monthly = client.get("/api/usage/monthly")
    assert monthly.status_code == 200
    assert len(monthly.json()["months"]) == 12

def test_bedroom_insights_screen():
    resp = client.get("/api/insights/bedroom")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_kwh" in data
    assert "plug_breakdown" in data

def test_billing_and_budgets_screens():
    bill_resp = client.get("/api/billing/summary")
    assert bill_resp.status_code == 200
    bill_data = bill_resp.json()
    assert "current_bill" in bill_data
    assert "past_bills" in bill_data
    
    budget_resp = client.get("/api/budgets")
    assert budget_resp.status_code == 200
    budget_data = budget_resp.json()
    assert budget_data["monthly_budget_usd"] == 150.0

def test_devices_and_connect():
    connect_resp = client.post("/api/devices/esp32_sct013_res_01/connect")
    assert connect_resp.status_code == 200
    assert connect_resp.json()["pairing_status"] == "CONNECTED"
    
    devices_resp = client.get("/api/devices")
    assert devices_resp.status_code == 200
    devices = devices_resp.json()
    assert len(devices) >= 1

def test_notifications_and_auth():
    notifs = client.get("/api/notifications")
    assert notifs.status_code == 200
    assert isinstance(notifs.json(), list)
    
    auth_resp = client.post("/api/auth/login", json={"username": "leslie294", "password": "any"})
    assert auth_resp.status_code == 200
    user_info = auth_resp.json()["user"]
    assert user_info["full_name"] == "Leslie Raymond"
    assert user_info["email"] == "leslie@gmail.com"
