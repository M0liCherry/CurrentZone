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
    Returns list of connected smart plug devices and sensors (Smart Fridge, Smart TV, Smart Lamp, AC, ESP32).
    """
    devices = db.query(Device).filter(Device.user_id == 1).all()
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
        # Create virtual entry if registering on-the-fly
        device = Device(
            id=device_id,
            user_id=1,
            name="New Smart Plug",
            device_type="smart_plug",
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
        message="Smart Plug successfully paired and ready to monitor real-time energy usage."
    )
