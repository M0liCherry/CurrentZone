from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class DeviceCreate(BaseModel):
    id: str
    name: str
    device_type: str = "smart_plug"  # "smart_plug" or "transformer_monitor"
    room: str = "Bedroom"
    zone: str = "Residential South"
    transformer_id: Optional[str] = "TX-RES-01"

class DeviceStatus(BaseModel):
    id: str
    name: str
    device_type: str
    room: str
    zone: str
    transformer_id: Optional[str]
    is_online: bool
    current_power_w: float
    current_amps: float
    daily_kwh: float
    last_seen: datetime

class ConnectDeviceResponse(BaseModel):
    success: bool
    device_id: str
    device_name: str
    pairing_status: str
    message: str
