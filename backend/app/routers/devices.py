from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import Device
from app.schemas.device import DeviceStatus, DeviceCreate, ConnectDeviceResponse
from app.services import dummy_stream as dummy_stream_service

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


class DummyStreamRequest(BaseModel):
    transformer_id: Optional[str] = "TX-RES-01"
    interval_s: float = 3.0
    max_readings: Optional[int] = None


@router.post("/{device_id}/dummy-stream/start")
def start_dummy_stream(device_id: str, payload: DummyStreamRequest = DummyStreamRequest(),
                       db: Session = Depends(get_db)):
    """
    Starts the server-side dummy ESP stream for this device (same varying
    current model as the ESP dummy firmware). Called by the frontend right
    after 'Connect Device' so live telemetry appears with no hardware.
    """
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
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
        db.commit()
    else:
        device.is_online = True
        device.last_seen = datetime.utcnow()
        db.commit()

    started = dummy_stream_service.start_dummy_stream(
        device_id,
        transformer_id=payload.transformer_id or "TX-RES-01",
        interval_s=payload.interval_s or 3.0,
        max_readings=payload.max_readings,
    )
    return {
        "success": True,
        "device_id": device_id,
        "streaming": True,
        "already_running": not started,
        "message": "Dummy ESP stream started — varying current readings incoming."
        if started else "Dummy ESP stream already running.",
    }


@router.post("/{device_id}/dummy-stream/stop")
def stop_dummy_stream(device_id: str):
    """Stops the server-side dummy ESP stream for this device."""
    stopped = dummy_stream_service.stop_dummy_stream(device_id)
    return {
        "success": True,
        "device_id": device_id,
        "streaming": False,
        "was_running": stopped,
        "message": "Dummy ESP stream stopped." if stopped else "No dummy stream was running.",
    }


@router.get("/{device_id}/dummy-stream/status")
def dummy_stream_status(device_id: str):
    """Returns whether the dummy ESP stream is currently running."""
    return {
        "device_id": device_id,
        "streaming": dummy_stream_service.is_streaming(device_id),
    }
