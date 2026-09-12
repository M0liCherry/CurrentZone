from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class ApplianceTelemetry(BaseModel):
    id: str = Field(..., description="Device ID (e.g. dev_ac_01)")
    name: str = Field(..., description="Device display name")
    room: Optional[str] = Field("General", description="Room location")
    power_w: float = Field(0.0, description="Active power in Watts")
    current_a: Optional[float] = Field(0.0, description="Current in Amperes")
    daily_kwh: Optional[float] = Field(0.0, description="Accumulated energy today in kWh")

class TelemetryIngestRequest(BaseModel):
    device_id: str = Field(..., description="Unique ESP32 device identifier (e.g., esp32_sct013_01)")
    transformer_id: Optional[str] = Field(None, description="Transformer ID monitored by this CT sensor")
    current_rms: float = Field(..., description="AC Current in Amperes RMS measured via SCT-013")
    power_kw: Optional[float] = Field(None, description="Active or apparent power in kW")
    voltage_v: Optional[float] = Field(230.0, description="Measured or nominal grid voltage in Volts")
    frequency_hz: Optional[float] = Field(50.0, description="Grid frequency in Hz")
    energy_kwh_total: Optional[float] = Field(0.0, description="Cumulative kWh measured")
    peak_surge_a: Optional[float] = Field(0.0, description="Peak instant surge current in Amperes")
    sample_count: Optional[int] = Field(500, description="Number of ADC samples taken per calculation window")
    burden_ohms: Optional[float] = Field(22.0, description="SCT-013 burden resistor value")
    appliances: Optional[List[ApplianceTelemetry]] = Field(None, description="Simulated or monitored appliances breakdown")

class TelemetryIngestResponse(BaseModel):
    success: bool
    reading_id: int
    transformer_id: Optional[str]
    current_rms: float
    power_kw: float
    load_pct: float
    risk_level: str
    failure_probability: float
    message: str

class LiveTelemetryBroadcast(BaseModel):
    timestamp: str
    device_id: str
    transformer_id: Optional[str]
    current_rms: float
    power_kw: float
    voltage_v: float
    load_pct: float
    peak_surge_a: float
    risk_level: str
