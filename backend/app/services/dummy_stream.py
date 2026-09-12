"""
Server-side dummy telemetry stream.

Triggered by the frontend "Connect Device" button via
POST /api/devices/{device_id}/dummy-stream/start.

Runs an asyncio background task per device that generates a continuously
varying dummy current (same model as backend/esp/main/dummy_load.c and
backend/esp/dummy_sender.py) and writes TelemetryReading rows directly,
updates the Device live fields, and broadcasts on the telemetry WebSocket
manager — so dashboards show live data with no ESP hardware required.
"""

from __future__ import annotations

import asyncio
import math
import random
from datetime import datetime
from typing import Dict, Optional

from app.database import SessionLocal
from app.models.grid import Transformer, TelemetryReading
from app.models.user import Device
from app.services.outage_predictor import outage_predictor

# device_id -> asyncio.Task
_active_streams: Dict[str, asyncio.Task] = {}
# device_id -> generator state
_stream_state: Dict[str, dict] = {}


def _next_dummy_amps(state: dict) -> float:
    state["step"] += 1
    step = state["step"]
    drift = math.sin(step * 2.0 * math.pi / 90.0) * 0.35
    state["walk"] += random.uniform(-1.5, 1.5)
    state["walk"] = max(-8.0, min(8.0, state["walk"]))
    surge = 1.0
    if state["surge_left"] == 0 and random.random() < 0.08:
        state["surge_left"] = random.randint(1, 2)
        state["surge_mult"] = random.uniform(1.5, 2.5)
    if state["surge_left"] > 0:
        surge = state["surge_mult"]
        state["surge_left"] -= 1
    current = (24.0 * (1.0 + drift) + state["walk"]) * surge
    return max(0.5, min(98.0, current))


async def _stream_loop(device_id: str, transformer_id: str = "TX-RES-01",
                       interval_s: float = 3.0, max_readings: Optional[int] = None) -> None:
    """Background loop: generate + persist one reading every `interval_s`."""
    # Import here to avoid circular import (telemetry router imports this module).
    from app.routers.telemetry import ws_manager

    count = 0
    energy_kwh = 0.0
    try:
        while True:
            if max_readings is not None and count >= max_readings:
                break
            state = _stream_state.setdefault(device_id, {
                "step": 0, "walk": 0.0, "surge_left": 0, "surge_mult": 1.0,
            })
            current_rms = _next_dummy_amps(state)
            voltage = 230.0
            power_kw = round((voltage * current_rms * 0.92) / 1000.0, 3)
            energy_kwh += power_kw * (interval_s / 3600.0)
            peak = round(current_rms * 1.4142, 2)
            load_pct = round((current_rms / 100.0) * 100.0, 1)

            db = SessionLocal()
            try:
                transformer = db.query(Transformer).filter(
                    Transformer.id == transformer_id).first()
                if transformer is None:
                    transformer = db.query(Transformer).filter(
                        Transformer.id == "TX-RES-01").first()

                prediction = outage_predictor.predict_outage_risk(
                    transformer_id=transformer.id if transformer else "TX-RES-01",
                    transformer_name=transformer.name if transformer else "Residential Substation",
                    zone=transformer.zone if transformer else "Residential South",
                    current_rms=current_rms,
                    rated_current_amps=100.0,
                    rated_kva=transformer.rated_kva if transformer else 100.0,
                    installation_year=transformer.installation_year if transformer else 2018,
                    hour_of_day=datetime.utcnow().hour,
                )

                reading = TelemetryReading(
                    timestamp=datetime.utcnow(),
                    transformer_id=transformer.id if transformer else None,
                    device_id=device_id,
                    current_rms=round(current_rms, 2),
                    power_kw=power_kw,
                    voltage_v=voltage,
                    frequency_hz=50.0,
                    energy_kwh_total=round(energy_kwh, 4),
                    peak_surge_a=peak,
                    sample_count=500,
                    load_pct=load_pct,
                )
                db.add(reading)

                device = db.query(Device).filter(Device.id == device_id).first()
                if device:
                    device.is_online = True
                    device.current_power_w = power_kw * 1000.0
                    device.current_amps = round(current_rms, 2)
                    device.last_seen = datetime.utcnow()

                if transformer:
                    transformer.current_top_oil_temp = prediction["top_oil_temp_c"]
                    transformer.health_score = max(
                        20.0, 100.0 - prediction["failure_probability_pct"] * 0.7)

                db.commit()

                await ws_manager.broadcast({
                    "timestamp": reading.timestamp.isoformat(),
                    "device_id": device_id,
                    "transformer_id": transformer.id if transformer else None,
                    "current_rms": round(current_rms, 2),
                    "power_kw": power_kw,
                    "voltage_v": voltage,
                    "load_pct": load_pct,
                    "peak_surge_a": peak,
                    "risk_level": prediction["risk_level"],
                    "failure_probability_pct": prediction["failure_probability_pct"],
                    "source": "dummy_stream",
                })
            finally:
                db.close()

            count += 1
            await asyncio.sleep(interval_s)
    except asyncio.CancelledError:
        raise
    finally:
        _active_streams.pop(device_id, None)


def start_dummy_stream(device_id: str, transformer_id: str = "TX-RES-01",
                       interval_s: float = 3.0,
                       max_readings: Optional[int] = None) -> bool:
    """Start (or restart) the dummy stream. Returns True if newly started."""
    existing = _active_streams.get(device_id)
    if existing and not existing.done():
        return False
    _stream_state[device_id] = {"step": 0, "walk": 0.0, "surge_left": 0, "surge_mult": 1.0}
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return False
    _active_streams[device_id] = loop.create_task(
        _stream_loop(device_id, transformer_id, interval_s, max_readings))
    return True


def stop_dummy_stream(device_id: str) -> bool:
    """Cancel the dummy stream. Returns True if a stream was running."""
    task = _active_streams.pop(device_id, None)
    if task is None:
        return False
    task.cancel()
    return True


def is_streaming(device_id: str) -> bool:
    task = _active_streams.get(device_id)
    return task is not None and not task.done()
