from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import Device
from app.schemas.device import DeviceStatus, DeviceCreate, ConnectDeviceResponse

router = APIRouter(prefix="/devices", tags=["Devices & Smart Plugs"])

@router.get("/", response_model=List[DeviceStatus])
def list_devices(db: Session = Depends(get_db)):
    """
    Returns list of connected smart plug devices and sensors reporting from ESP32 or external plugs.
    Dynamically marks devices offline if no telemetry received within the last 10 seconds.
    """
    now = datetime.utcnow()
    devices = db.query(Device).filter(Device.user_id == 1).all()
    changed = False
    for d in devices:
        if d.is_online and d.last_seen and (now - d.last_seen).total_seconds() > 10.0:
            d.is_online = False
            d.current_power_w = 0.0
            d.current_amps = 0.0
            changed = True
    if changed:
        db.commit()
    return devices

@router.post("/register", response_model=DeviceStatus)
def register_device(payload: DeviceCreate, db: Session = Depends(get_db)):
    """
    Registers a new smart plug or ESP32 transformer monitor.
    """
    existing = db.query(Device).filter(Device.id == payload.id).first()
    if existing:
        return existing
        
    device = Device(
        id=payload.id,
        user_id=1,
        name=payload.name,
        device_type=payload.device_type,
        room=payload.room,
        zone=payload.zone,
        transformer_id=payload.transformer_id,
        is_online=True,
        current_power_w=0.0,
        current_amps=0.0,
        daily_kwh=0.0,
        last_seen=datetime.utcnow()
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device

@router.post("/{device_id}/connect", response_model=ConnectDeviceResponse)
def connect_device(device_id: str, db: Session = Depends(get_db)):
    """
    Action corresponding to the 'Connect Device' button in SmartWatt 'Connect Device.png'.
    """
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        # Create entry if registering on-the-fly
        device = Device(
            id=device_id,
            user_id=1,
            name="New Smart Plug" if "plug" in device_id.lower() else "ESP32 Sensor",
            device_type="smart_plug" if "plug" in device_id.lower() else "transformer_monitor",
            room="Bedroom",
            is_online=True,
            last_seen=datetime.utcnow()
        )
        db.add(device)
    else:
        device.is_online = True
        device.last_seen = datetime.utcnow()
        
    db.commit()
    return ConnectDeviceResponse(
        success=True,
        device_id=device.id,
        device_name=device.name,
        pairing_status="CONNECTED",
        message="Device paired and ready to receive real-time telemetry from ESP32 or sensor."
    )

