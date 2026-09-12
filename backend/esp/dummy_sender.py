"""
SmartWatt ESP dummy telemetry sender (PC test double).

Mimics `backend/esp/main/dummy_load.c` + `telemetry_client.c` without ESP
hardware: generates a continuously varying current waveform and POSTs it to
the FastAPI backend — the same payload the ESP32 sends.

Usage:
    python dummy_sender.py --backend-url http://localhost:8000 --count 20
    python dummy_sender.py --backend-url http://localhost:8000 --interval 3 --count 0   # infinite

This is what the frontend "Connect Device" flow triggers server-side via
POST /api/devices/{device_id}/dummy-stream/start. Run this script directly
when you want to emulate a physical ESP from your laptop.
"""

from __future__ import annotations

import argparse
import math
import random
import time
import urllib.request
import urllib.error
import json


def next_dummy_current(step: int, walk: float) -> tuple[float, float]:
    """Return (current_rms, updated_walk) with drift + noise + surges."""
    drift = math.sin(step * 2.0 * math.pi / 90.0) * 0.35
    walk += random.uniform(-1.5, 1.5)
    walk = max(-8.0, min(8.0, walk))
    surge = 1.0
    if random.random() < 0.08:  # ~8% appliance inrush
        surge = random.uniform(1.5, 2.5)
    current = (24.0 * (1.0 + drift) + walk) * surge
    current = max(0.5, min(98.0, current))
    return current, walk


def post_telemetry(backend_url: str, device_id: str, transformer_id: str,
                   current_rms: float, energy_kwh: float) -> dict:
    voltage = 230.0
    power_kw = round((voltage * current_rms * 0.92) / 1000.0, 3)
    payload = {
        "device_id": device_id,
        "transformer_id": transformer_id,
        "current_rms": round(current_rms, 2),
        "power_kw": power_kw,
        "voltage_v": voltage,
        "frequency_hz": 50.0,
        "energy_kwh_total": round(energy_kwh, 4),
        "peak_surge_a": round(current_rms * 1.4142, 2),
        "sample_count": 500,
        "burden_ohms": 22.0,
    }
    req = urllib.request.Request(
        f"{backend_url.rstrip('/')}/api/telemetry/ingest",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return {"status": resp.status, "body": json.loads(resp.read().decode())}
    except urllib.error.HTTPError as e:
        return {"status": e.code, "body": e.read().decode()[:500]}
    except Exception as e:  # backend down?
        return {"status": -1, "body": f"{type(e).__name__}: {e}"}


def main() -> None:
    parser = argparse.ArgumentParser(description="SmartWatt ESP dummy telemetry sender")
    parser.add_argument("--backend-url", default="http://localhost:8000")
    parser.add_argument("--device-id", default="esp32_sct013_res_01")
    parser.add_argument("--transformer-id", default="TX-RES-01")
    parser.add_argument("--interval", type=float, default=3.0, help="Seconds between POSTs")
    parser.add_argument("--count", type=int, default=20, help="Number of readings (0 = infinite)")
    args = parser.parse_args()

    print(f"Dummy ESP -> {args.backend_url} as {args.device_id} "
          f"(interval={args.interval}s, count={'inf' if args.count == 0 else args.count})")

    walk = 0.0
    energy_kwh = 0.0
    step = 0
    sent = 0
    try:
        while args.count == 0 or sent < args.count:
            step += 1
            current, walk = next_dummy_current(step, walk)
            energy_kwh += (230.0 * current * 0.92 / 1000.0) * (args.interval / 3600.0)
            result = post_telemetry(args.backend_url, args.device_id,
                                    args.transformer_id, current, energy_kwh)
            print(f"[{sent + 1}] {current:.2f} A -> HTTP {result['status']}")
            sent += 1
            if args.count == 0 or sent < args.count:
                time.sleep(args.interval)
    except KeyboardInterrupt:
        print(f"\nStopped after {sent} readings.")


if __name__ == "__main__":
    main()
