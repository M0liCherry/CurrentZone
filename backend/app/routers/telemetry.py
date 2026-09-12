import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.grid import Transformer, TelemetryReading
from app.models.user import Device, Notification, BudgetAlert
from app.schemas.telemetry import TelemetryIngestRequest, TelemetryIngestResponse, LiveTelemetryBroadcast
from app.services.outage_predictor import outage_predictor

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])

# Active WebSocket subscribers for live telemetry stream
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

ws_manager = ConnectionManager()

@router.post("/ingest", response_model=TelemetryIngestResponse)
async def ingest_telemetry(payload: TelemetryIngestRequest, db: Session = Depends(get_db)):
    """
    Ingests telemetry from ESP32 Robocraze SCT-013 100A AC current sensor.
    Computes active power, transformer loading %, evaluates failure risk,
    persists reading, and broadcasts to live dashboards.
    """
    # 1. Resolve transformer
    transformer = None
    if payload.transformer_id:
        transformer = db.query(Transformer).filter(Transformer.id == payload.transformer_id).first()
    if not transformer:
        transformer = db.query(Transformer).filter(Transformer.id == "TX-RES-01").first()
        
    voltage = payload.voltage_v or 230.0
    current_rms = float(payload.current_rms)
    
    # Active / Apparent Power in kW: P = (V * I * PF) / 1000
    power_kw = payload.power_kw or round((voltage * current_rms * 0.92) / 1000.0, 2)
    
    # Monitored branch rating (Robocraze SCT-013 100A AC current sensor: 100.0 A max)
    rated_current = 100.0
    load_pct = round((current_rms / rated_current) * 100.0, 1)
    
    # 2. Run Outage Prediction Engine
    prediction = outage_predictor.predict_outage_risk(
        transformer_id=transformer.id if transformer else "TX-RES-01",
        transformer_name=transformer.name if transformer else "Residential Substation",
        zone=transformer.zone if transformer else "Residential South",
        current_rms=current_rms,
        rated_current_amps=rated_current,
        rated_kva=transformer.rated_kva if transformer else 100.0,
        installation_year=transformer.installation_year if transformer else 2018,
        hour_of_day=datetime.utcnow().hour
    )
    
    # 3. Persist Telemetry
    reading = TelemetryReading(
        timestamp=datetime.utcnow(),
        transformer_id=transformer.id if transformer else None,
        device_id=payload.device_id,
        current_rms=current_rms,
        power_kw=power_kw,
        voltage_v=voltage,
        frequency_hz=payload.frequency_hz or 50.0,
        energy_kwh_total=payload.energy_kwh_total or 0.0,
        peak_surge_a=payload.peak_surge_a or current_rms,
        sample_count=payload.sample_count or 500,
        load_pct=load_pct
    )
    db.add(reading)
    
    # Update transformer current state
    if transformer:
        transformer.current_top_oil_temp = prediction["top_oil_temp_c"]
        transformer.health_score = max(20.0, 100.0 - prediction["failure_probability_pct"] * 0.7)
        
    # Update device status or auto-register if communicating for the first time
    device = db.query(Device).filter(Device.id == payload.device_id).first()
    if not device:
        is_sensor = any(k in payload.device_id.lower() for k in ["sct", "tx", "esp"])
        device = Device(
            id=payload.device_id,
            user_id=1,
            name="ESP32 SCT-013 Transformer Monitor" if is_sensor else payload.device_id.replace("_", " ").title(),
            device_type="transformer_monitor" if is_sensor else "smart_plug",
            room="Main Breaker / Feeder" if is_sensor else "General",
            zone=transformer.zone if transformer else "Residential South",
            transformer_id=transformer.id if transformer else "TX-RES-01",
            is_online=True,
            current_power_w=power_kw * 1000.0,
            current_amps=current_rms,
            daily_kwh=payload.energy_kwh_total or 0.0,
            last_seen=datetime.utcnow()
        )
        db.add(device)
    else:
        device.is_online = True
        device.current_power_w = power_kw * 1000.0
        device.current_amps = current_rms
        if payload.energy_kwh_total:
            device.daily_kwh = payload.energy_kwh_total
        device.last_seen = datetime.utcnow()
        
    # Update user's current spend based on recorded energy
    budget = db.query(BudgetAlert).filter(BudgetAlert.user_id == 1).first()
    if budget and payload.energy_kwh_total:
        budget.current_spent_usd = round(payload.energy_kwh_total * 0.15, 2)
        
    # Trigger alert notification if risk is high/critical
    if prediction["risk_level"] in ["HIGH", "CRITICAL"]:
        notif = Notification(
            user_id=1,
            title=f"⚠️ {prediction['risk_level']} Outage Risk: {transformer.name if transformer else 'Local Feeder'}",
            description=f"Failure probability {prediction['failure_probability_pct']}%. TTF: ~{prediction['estimated_ttf_minutes'] or 15} mins. {prediction['recommended_action']}",
            category="outage_alert",
            time_label=datetime.utcnow().strftime("%I:%M %p")
        )
        db.add(notif)
        
    db.commit()
    db.refresh(reading)
    
    # 4. Broadcast to WebSocket clients
    broadcast_data = {
        "timestamp": reading.timestamp.isoformat(),
        "device_id": payload.device_id,
        "transformer_id": transformer.id if transformer else None,
        "current_rms": current_rms,
        "power_kw": power_kw,
        "voltage_v": voltage,
        "load_pct": load_pct,
        "peak_surge_a": payload.peak_surge_a or current_rms,
        "risk_level": prediction["risk_level"],
        "failure_probability_pct": prediction["failure_probability_pct"]
    }
    await ws_manager.broadcast(broadcast_data)
    
    return TelemetryIngestResponse(
        success=True,
        reading_id=reading.id,
        transformer_id=transformer.id if transformer else None,
        current_rms=current_rms,
        power_kw=power_kw,
        load_pct=load_pct,
        risk_level=prediction["risk_level"],
        failure_probability=prediction["failure_probability_pct"],
        message=f"Telemetry recorded. Risk: {prediction['risk_level']} ({prediction['failure_probability_pct']}%)"
    )

@router.get("/latest")
def get_latest_telemetry(transformer_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Returns latest telemetry reading or null if awaiting sensor data or if ESP32 was disconnected.
    """
    query = db.query(TelemetryReading).order_by(TelemetryReading.timestamp.desc())
    if transformer_id:
        query = query.filter(TelemetryReading.transformer_id == transformer_id)
    reading = query.first()
    if not reading:
        return None
        
    # If the reading is older than 10 seconds, the device is disconnected / offline
    if (datetime.utcnow() - reading.timestamp).total_seconds() > 10.0:
        return None
        
    return reading


@router.websocket("/live")
async def live_telemetry_ws(websocket: WebSocket):
    """
    Real-time WebSocket endpoint streaming SCT-013 sensor data and outage risk.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep-alive receive
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
