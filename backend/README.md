# SmartWatt: Electricity Outage Predictor & Grid Intelligence

A comprehensive, production-grade backend and embedded firmware suite for **SmartWatt**, an AI-powered electricity outage prediction and energy intelligence platform.

---

## System Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │ Robocraze SCT-013 100A AC Current Sensor     │
                  │ Non-Invasive Split Current Transformer Core  │
                  └───────────────────────┬──────────────────────┘
                                          │ Analog AC Waveform
                                          ▼
                  ┌──────────────────────────────────────────────┐
                  │  ESP32 Microcontroller (backend/esp/)        │
                  │  - ADC Oneshot + eFuse Calibration           │
                  │  - Discrete RMS Current & Power Integration  │
                  │  - Wi-Fi Station with Auto-Reconnect         │
                  │  - HTTP JSON Telemetry Transmission          │
                  └───────────────────────┬──────────────────────┘
                                          │ HTTP POST /api/telemetry/ingest
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                       FastAPI Backend (backend/)                               │
│                                                                                │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────────┐ │
│  │ Telemetry Ingestion   │  │ Weather Service       │  │ Historical Outages  │ │
│  │ (ESP32 SCT-013 Feed)  │  │ (Heat Index / Storms) │  │ & Failure Logs DB   │ │
│  └──────────┬────────────┘  └──────────┬────────────┘  └──────────┬──────────┘ │
│             │                          │                          │            │
│             └───────────────────┐      │      ┌───────────────────┘            │
│                                 ▼      ▼      ▼                                │
│                     ┌──────────────────────────────────────┐                   │
│                     │ Outage Prediction ML & Physics Engine│                   │
│                     │ - IEEE C57.91 Transformer Thermal    │                   │
│                     │ - Consumption Anomaly & Surge Rate   │                   │
│                     │ - Random Forest Failure Classifier   │                   │
│                     │ - Time-to-Failure (TTF) Estimation   │                   │
│                     └──────────────────┬───────────────────┘                   │
│                                        │                                       │
│  ┌─────────────────────────────────────┴────────────────────────────────────┐  │
│  │                   SmartWatt UI REST & WebSocket APIs                     │  │
│  │  - /api/usage/*       (Daily, Weekly, Monthly kWh from Figma)            │  │
│  │  - /api/insights/*    (Appliance breakdown, Peak load kWh)               │  │
│  │  - /api/billing/*     (Current bill, Past bills, Cost estimates)         │  │
│  │  - /api/budgets/*     (User budget thresholds, limits)                   │  │
│  │  - /api/devices/*     (ESP & Smart Plug pairing, live telemetry)         │  │
│  │  - /api/predictor/*   (Area failure probabilities, heatmaps, TTF)        │  │
│  │  - /api/auth/*        (User login/register matching UI)                  │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Hardware Circuit: Robocraze SCT-013 100A AC Current Sensor

The **Robocraze SCT-013 100A AC Current Sensor** is a non-invasive current transformer with a 2000:1 turns ratio (100A AC input produces 50mA AC output).

### Schematic Connection to ESP32:
```
           +3.3V (ESP32)
             │
            [R1: 10kΩ]
             │
             ├──────[+] C1: 10µF Capacitor ────── GND
             │
             ├───────────────────┐
             │                   │
            [Rb: 22Ω Burden]   (SCT-013 Secondary Coils)
             │                   │
             ├───────────────────┘
             │
             ├───────────────> ESP32 ADC1 Channel (GPIO 34)
             │
            [R2: 10kΩ]
             │
            GND
```

- **Burden Resistor ($R_b = 22\Omega$)**: Converts 50mA secondary RMS current into an AC voltage ($V_{peak} \approx \pm 1.55\text{V}$ at 100A RMS).
- **DC Bias Divider ($R_1 = 10\text{k}\Omega, R_2 = 10\text{k}\Omega, C_1 = 10\mu\text{F}$)**: Lifts the AC signal onto a $1.65\text{V}$ DC midpoint reference so the single-supply ESP32 ADC ($0 - 3.3\text{V}$) can sample the complete sinusoidal waveform.

---

## 2. Building & Flashing ESP32 Firmware (`backend/esp/`)

The firmware is located in `backend/esp/` and built with ESP-IDF.

```bash
# 1. Activate ESP-IDF environment
source /home/nate/Projects/esp/esp-idf/export.sh

# 2. Navigate to esp directory
cd backend/esp

# 3. Build firmware
idf.py build

# 4. Flash to ESP32 (replace /dev/ttyUSB0 with your device port)
idf.py -p /dev/ttyUSB0 flash monitor
```

---

## 3. Running the Python Backend (`backend/`)

The backend is built with FastAPI and packaged using `uv`.

```bash
cd backend

# Run the test suite
uv run pytest -v

# Start the live API server
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 4. API Reference

### Telemetry Ingestion
- `POST /api/telemetry/ingest`: Ingests real-time measurements from ESP32 SCT-013.
- `GET /api/telemetry/latest`: Returns the most recent reading.
- `WS /api/telemetry/live`: Real-time WebSocket streaming.

### Outage Prediction & Grid Intelligence
- `GET /api/predictor/overview`: High-level grid failure risk summary across all sectors.
- `GET /api/predictor/zones`: List of zones with failure probability, risk tiers, and weather stress.
- `GET /api/predictor/transformers/{id}`: Deep diagnosis of transformer loading, oil temperature, and TTF.
- `POST /api/predictor/simulate`: Scenario stress testing (heatwave, storm gusts, overload).

### SmartWatt UI Endpoints
- `GET /api/usage/daily`: Today's hourly usage (12AM, 4AM, 8AM, 12PM, 4PM, 8PM), average daily use (28 kWh, +20%).
- `GET /api/usage/weekly`: Weekly usage (Mon-Sun).
- `GET /api/usage/monthly`: 12-month consumption curve.
- `GET /api/insights/bedroom`: Bedroom energy overview, plug comparison, AC/Fan/Light breakdown, 4.5 rating.
- `GET /api/billing/summary`: Estimated bill ($123.50, due Oct 15), past bills, $20 savings, green promo.
- `GET /api/budgets` & `POST /api/budgets`: Monthly budget threshold management.
- `GET /api/devices`: List connected smart plugs.
- `POST /api/devices/{id}/connect`: Connect device pairing action.
- `GET /api/notifications`: Alert tray matching Figma lock screen notifications.
- `POST /api/auth/login`: User authentication for demo user `leslie294`.
