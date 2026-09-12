from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.grid import Transformer, TelemetryReading, HistoricalOutage
from app.schemas.predictor import OutageRiskOverview, ScenarioSimulationRequest, SimulationResult
from app.services.outage_predictor import outage_predictor
from app.services.weather_service import weather_service

router = APIRouter(prefix="/predictor", tags=["Outage Predictor"])

@router.get("/overview")
def get_grid_overview(db: Session = Depends(get_db)):
    """
    Returns high-level electricity outage risk overview across all grid sectors.
    """
    transformers = db.query(Transformer).all()
    results = []
    
    critical_count = 0
    high_count = 0
    
    for tx in transformers:
        # Get latest reading or 0.0 if awaiting telemetry
        latest_reading = db.query(TelemetryReading)\
            .filter(TelemetryReading.transformer_id == tx.id)\
            .order_by(TelemetryReading.timestamp.desc()).first()
            
        now = datetime.utcnow()
        is_live = bool(latest_reading and (now - latest_reading.timestamp).total_seconds() <= 10.0)
        current = latest_reading.current_rms if is_live else 0.0
        rated_current = 100.0
        
        pred = outage_predictor.predict_outage_risk(
            transformer_id=tx.id,
            transformer_name=tx.name,
            zone=tx.zone,
            current_rms=current,
            rated_current_amps=rated_current,
            rated_kva=tx.rated_kva,
            installation_year=tx.installation_year,
            hour_of_day=datetime.utcnow().hour
        )
        if not is_live:
            pred["primary_factors"] = ["ESP32 sensor is disconnected or offline. No live telemetry stream."]
            pred["recommended_action"] = "Reconnect ESP32 monitor to resume live telemetry."
            pred["all_mitigations"] = ["Reconnect ESP32 monitor to resume live telemetry."]

        if pred["risk_level"] == "CRITICAL":
            critical_count += 1
        elif pred["risk_level"] == "HIGH":
            high_count += 1
            
        results.append(pred)
        
    weather_summary = weather_service.get_zone_weather("Residential South")
    
    return {
        "status": "online",
        "timestamp": datetime.utcnow().isoformat(),
        "monitored_transformers_count": len(transformers),
        "critical_risk_zones": critical_count,
        "high_risk_zones": high_count,
        "overall_grid_status": "CRITICAL ATTENTION" if critical_count > 0 else ("ELEVATED" if high_count > 0 else "STABLE"),
        "ambient_heat_index": weather_summary["heat_index_c"],
        "max_wind_gust_kmh": weather_summary["wind_gust_kmh"],
        "zones": results
    }

@router.get("/zones", response_model=List[OutageRiskOverview])
def get_all_zones_risk(db: Session = Depends(get_db)):
    """
    Returns outage predictions and failure risk scores grouped by zone.
    """
    transformers = db.query(Transformer).all()
    results = []
    for tx in transformers:
        latest = db.query(TelemetryReading).filter(TelemetryReading.transformer_id == tx.id)\
            .order_by(TelemetryReading.timestamp.desc()).first()
        current = latest.current_rms if latest else 0.0
        rated_current = 100.0
        
        pred = outage_predictor.predict_outage_risk(
            transformer_id=tx.id,
            transformer_name=tx.name,
            zone=tx.zone,
            current_rms=current,
            rated_current_amps=rated_current,
            rated_kva=tx.rated_kva,
            installation_year=tx.installation_year
        )
        results.append(pred)
    return results

@router.get("/transformers/{transformer_id}", response_model=OutageRiskOverview)
def get_transformer_risk(transformer_id: str, db: Session = Depends(get_db)):
    """
    Detailed outage risk diagnosis for a specific distribution transformer.
    """
    tx = db.query(Transformer).filter(Transformer.id == transformer_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transformer not found")
        
    latest = db.query(TelemetryReading).filter(TelemetryReading.transformer_id == tx.id)\
        .order_by(TelemetryReading.timestamp.desc()).first()
    current = latest.current_rms if latest else 0.0
    rated_current = 100.0
    
    return outage_predictor.predict_outage_risk(
        transformer_id=tx.id,
        transformer_name=tx.name,
        zone=tx.zone,
        current_rms=current,
        rated_current_amps=rated_current,
        rated_kva=tx.rated_kva,
        installation_year=tx.installation_year
    )


@router.post("/simulate", response_model=SimulationResult)
def simulate_scenario(scenario: ScenarioSimulationRequest, db: Session = Depends(get_db)):
    """
    Simulates severe weather (heatwave / storm) and transformer current load
    to test failure probability and Time-to-Failure (TTF).
    """
    tx = db.query(Transformer).filter(Transformer.id == scenario.transformer_id).first()
    if not tx:
        tx = db.query(Transformer).filter(Transformer.id == "TX-RES-01").first()
        
    rated_current = 100.0
    current = scenario.current_rms or (rated_current * 1.15)
    
    weather_override = {
        "ambient_temp_c": scenario.ambient_temp_c,
        "wind_gust_kmh": scenario.wind_gust_kmh,
        "rain_mm": scenario.rain_mm,
        "lightning_index": scenario.lightning_index
    }
    
    pred = outage_predictor.predict_outage_risk(
        transformer_id=tx.id,
        transformer_name=tx.name,
        zone=scenario.zone,
        current_rms=current,
        rated_current_amps=rated_current,
        rated_kva=tx.rated_kva,
        installation_year=tx.installation_year,
        weather_override=weather_override
    )
    
    return SimulationResult(
        zone=scenario.zone,
        transformer_id=tx.id,
        failure_probability_pct=pred["failure_probability_pct"],
        risk_level=pred["risk_level"],
        estimated_ttf_minutes=pred["estimated_ttf_minutes"],
        simulated_load_pct=pred["current_load_pct"],
        simulated_oil_temp_c=pred["top_oil_temp_c"],
        primary_factors=pred["primary_factors"],
        mitigation_actions=pred["all_mitigations"]
    )
