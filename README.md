# CurrentZone (SmartWatt) — AI Electricity Outage Predictor & Grid Intelligence

**CurrentZone** (SmartWatt) is an intelligent, end-to-end IoT and Machine Learning platform designed to predict, detect, and mitigate electricity outages before they occur. 

By continuously ingesting high-frequency AC current telemetry from non-invasive sensors on distribution transformers and feeder lines, cross-referencing real-time atmospheric weather data, and modeling diurnal consumption surge dynamics, CurrentZone computes failure probabilities (0–100%), forecasts Time-to-Failure (TTF), and provides actionable load-shedding and maintenance recommendations.

---

## ⚡ The Problem: Why Grid Failures Occur

Distribution grids and localized power transformers face catastrophic stress from four converging factors:
1. **Thermal Overload**: During extreme heatwaves, concurrent air conditioning load causes transformer winding and top-oil temperatures to exceed thermal limits (IEEE C57.91), accelerating insulation aging exponentially and causing thermal blowouts.
2. **Weather-Induced Hazards**: High storm wind gusts (>50 km/h) snap overhead tree limbs into feeder conductors; lightning strikes induce high-voltage flashovers; and heavy rain causes vault water ingress.
3. **Consumption Surges**: Uncharacteristic rapid demand spikes ($dI/dt$) occur when localized heavy appliances (EV chargers, compressors, industrial loads) turn on simultaneously, tripping branch fuses and circuit breakers.
4. **Lack of Early Warning**: Conventional utilities only discover failures after customers call in blackouts, lacking proactive localized telemetry at the distribution transformer level.

---

## 💡 The Solution & Project Idea

CurrentZone bridges physical electrical engineering with machine learning and IoT:

```
                  ┌──────────────────────────────────────────────┐
                  │ Robocraze SCT-013 100A AC Current Sensor     │
                  │ Non-Invasive Split Current Transformer Core  │
                  └───────────────────────┬──────────────────────┘
                                          │ Analog AC Signal (Burden + 1.65V DC Bias)
                                          ▼
                  ┌──────────────────────────────────────────────┐
                  │   ESP32 Microcontroller (backend/esp/)       │
                  │   - eFuse Calibrated ADC Oneshot Sampling    │
                  │   - Discrete True RMS Current (I_rms)        │
                  │   - Active & Apparent Power Integration      │
                  │   - Wi-Fi Station & HTTP Telemetry POST      │
                  └───────────────────────┬──────────────────────┘
                                          │ JSON Telemetry over Wi-Fi
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                       FastAPI Backend (backend/)                               │
│                                                                                │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────────┐ │
│  │ Telemetry Ingestion   │  │ Weather Telemetry     │  │ Historical Outages  │ │
│  │ (ESP32 SCT-013 Feed)  │  │ (Heat Index, Storms)  │  │ & Incident Logs DB  │ │
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
│                     │ - Automated Early Warning Alerts     │                   │
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

## 🔬 Core Analytical & Machine Learning Pillars

### 1. Transformer Thermal Physics Model (IEEE C57.91)
- Calculates steady-state and dynamic top-oil temperature rise over ambient:
  $$\Delta \theta_{TO} = \Delta \theta_{TO,rated} \times \left(\frac{K^2 R + 1}{R + 1}\right)^n$$
- Calculates winding hottest-spot temperature ($\theta_H$) and the **Aging Acceleration Factor ($F_{AA}$)** via the Arrhenius equation:
  $$F_{AA} = \exp\left(\frac{15000}{383} - \frac{15000}{\theta_H + 273}\right)$$
- Flags severe insulation breakdown risk when hot-spot temperature exceeds 125°C.

### 2. Weather Stress Index
- Evaluates ambient temperature and **Heat Index** (apparent temperature under high humidity, severely degrading natural transformer cooling).
- Monitors wind gusts (vegetation hazard threshold > 50 km/h), precipitation, and lightning strike frequency.

### 3. Consumption Surge & Anomaly Detection
- Tracks 24-hour diurnal baselines (morning wake-up surge, evening peak congestion).
- Computes **Surge Velocity** ($dI/dt$ in Amperes/step) to detect sudden localized demand spikes before circuit protection fuses blow.

### 4. Machine Learning Grid Failure Classifier
- Trained Random Forest & Gradient Boosting models fusing physical boundary rules with multi-feature classification:
  - **Inputs**: `[load_pct, top_oil_temp, ambient_temp, wind_gust, lightning_index, surge_score, zone_outage_rate, equipment_age]`
  - **Outputs**:
    - **Outage Probability**: `0% to 100%`
    - **Risk Tier**: `LOW` (< 20%), `MODERATE` (20–45%), `HIGH` (45–70%), `CRITICAL` (> 70%)
    - **Time-to-Failure (TTF)**: Estimated minutes remaining before thermal trip or insulator flashover.
    - **Mitigation Directives**: Automated load shedding, auxiliary fan engagement, or line inspection patrol dispatch.

---

## 🔌 Hardware Circuit: Robocraze SCT-013 100A AC Current Sensor

The **Robocraze SCT-013 100A AC Current Sensor** is a non-invasive current transformer with a 2000:1 turns ratio (100A AC input produces 50mA AC output).

### Circuit Schematic to ESP32:
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

- **Burden Resistor ($R_b = 22\Omega$)**: Converts secondary current into an AC voltage ($V_{peak} \approx \pm 1.55\text{V}$ at 100A RMS).
- **DC Bias Divider ($R_1 = 10\text{k}\Omega, R_2 = 10\text{k}\Omega, C_1 = 10\mu\text{F}$)**: Lifts the AC signal onto a $1.65\text{V}$ DC midpoint reference so the single-supply ESP32 ADC ($0 - 3.3\text{V}$) can sample the complete sinusoidal waveform.
- **Sampling & Integration**: The ESP-IDF firmware samples 500 points over 10 full 50Hz cycles (200ms window), removes the dynamic DC offset, computes discrete true RMS ($I_{rms} = \sqrt{\frac{1}{N}\sum I_k^2}$), calculates active power ($P = V \times I \times \text{PF}$), and accumulates kWh energy.

---

## 📱 SmartWatt UI Application Endpoints

The backend natively supports every screen in the Figma mobile design:

| Figma Screen | Backend Route | Description |
| :--- | :--- | :--- |
| **Usage Details** | `GET /api/usage/daily` | Today's hourly usage (12AM, 4AM, 8AM, 12PM, 4PM, 8PM), average daily use (28 kWh, +20%), vs yesterday (+5 kWh). |
| **Weekly / Monthly** | `GET /api/usage/weekly`<br>`GET /api/usage/monthly` | Mon–Sun weekly consumption and 12-month consumption curve. |
| **Energy Insights** | `GET /api/insights/bedroom` | Bedroom breakdown: AC (45 kWh / 37.5%), Fan (30 kWh / 25%), Light (25 kWh / 20.8%), 4.5 star rating. |
| **Cost Estimation** | `GET /api/billing/summary` | Current bill ($123.50, due Oct 15), past bills, $20 savings this month, green promo. |
| **Budgets & Alerts** | `GET /api/budgets`<br>`POST /api/budgets` | Set monthly budget limits and automated threshold alerts. |
| **Connect Device** | `POST /api/devices/{id}/connect` | Smart plug and ESP32 non-invasive CT monitor pairing. |
| **Notifications** | `GET /api/notifications` | Push notification tray for outage risk warnings, high usage, and budgets. |
| **User Profile** | `GET /api/auth/me`<br>`POST /api/auth/login` | User authentication matching Leslie Raymond (`leslie294`). |
| **Outage Intelligence** | `GET /api/predictor/overview`<br>`POST /api/predictor/simulate` | Grid-wide risk overview, zone vulnerabilities, and scenario stress testing. |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python**: `>= 3.12` with [`uv`](https://github.com/astral-sh/uv) installed.
- **ESP-IDF**: `v5.x` or `v6.x` located in `../esp/esp-idf` or system PATH.

### 2. Running the Python Backend
```bash
cd backend

# Run the test suite (10/10 tests)
uv run pytest -v

# Launch the live FastAPI server
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive OpenAPI documentation will be available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### 3. Compiling & Flashing ESP32 Firmware
```bash
# Activate ESP-IDF environment
source /home/nate/Projects/esp/esp-idf/export.sh

# Navigate to esp directory
cd backend/esp

# Build firmware
idf.py build

# Flash to device (replace /dev/ttyUSB0 with your serial port)
idf.py -p /dev/ttyUSB0 flash monitor
```

### 4. Simulating Outage Scenarios
You can test the failure prediction engine under severe simulated conditions (e.g. 42°C heatwave + 72 km/h wind gusts + 115A overload) with a single cURL request:

```bash
curl -X POST "http://localhost:8000/api/predictor/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Residential South",
    "transformer_id": "TX-RES-01",
    "current_rms": 115.0,
    "ambient_temp_c": 42.0,
    "wind_gust_kmh": 72.0,
    "rain_mm": 25.0,
    "lightning_index": 8.0
  }'
```

**Response**:
```json
{
  "zone": "Residential South",
  "transformer_id": "TX-RES-01",
  "failure_probability_pct": 89.2,
  "risk_level": "CRITICAL",
  "estimated_ttf_minutes": 15,
  "simulated_load_pct": 115.0,
  "simulated_oil_temp_c": 98.4,
  "primary_factors": [
    "Transformer overloaded at 115.0% rated capacity (115.0A).",
    "High top-oil thermal rise (98.4°C, Hot-spot 127.2°C).",
    "Severe ambient heatwave (42.0°C, Heat Index 52.8°C).",
    "Dangerous storm gusts up to 72.0 km/h (feeder vegetation hazard).",
    "Severe lightning activity detected (Index 8.0/10)."
  ],
  "mitigation_actions": [
    "Initiate immediate load shedding on non-essential heavy appliances.",
    "Inspect transformer auxiliary cooling fans & radiator banks.",
    "Dispatch field patrol to clear high-risk tree branches near overhead lines.",
    "Verify substation surge arresters & grounding continuity."
  ]
}
```

---

## 📂 Project Structure

```
Current_Zone/
├── README.md                  # Root project overview & architecture
├── .gitignore                 # Git ignore rules for Python & ESP-IDF
├── design_exports/            # Exported Figma UI screens & flowcharts
└── backend/
    ├── README.md              # Backend & hardware detailed guide
    ├── pyproject.toml         # Dependencies & configuration (uv)
    ├── uv.lock                # Locked dependency tree
    ├── main.py                # Server entry point
    ├── tests/                 # Comprehensive test suite
    │   └── test_api.py        # 10 integration & algorithm tests
    ├── app/
    │   ├── config.py          # Grid & sensor settings
    │   ├── database.py        # SQLAlchemy session & SQLite/Postgres
    │   ├── seed_data.py       # Grid topology & demo account seed
    │   ├── models/            # SQLAlchemy database models
    │   │   ├── grid.py        # Transformers, Telemetry, Outages, Weather
    │   │   └── user.py        # Users, Devices, Budgets, Notifications
    │   ├── schemas/           # Pydantic validation schemas
    │   ├── services/          # Core analytics & prediction engines
    │   │   ├── thermal_model.py     # IEEE C57.91 Transformer Physics
    │   │   ├── weather_service.py   # Heat index & storm modeling
    │   │   ├── anomaly_detector.py  # Surge velocity & diurnal profiles
    │   │   ├── outage_predictor.py  # Scikit-learn Failure Classifier
    │   │   └── grid_analytics.py    # Figma UI aggregations
    │   └── routers/           # FastAPI REST & WebSocket endpoints
    └── esp/                   # ESP-IDF C Project for ESP32
        ├── CMakeLists.txt     # Root CMake configuration
        ├── sdkconfig.defaults # Hardware defaults & FreeRTOS settings
        └── main/
            ├── CMakeLists.txt
            ├── sct013.h / .c         # Robocraze SCT-013 100A ADC driver
            ├── wifi_station.h / .c   # Wi-Fi station with auto-reconnect
            ├── telemetry_client.h / .c # HTTP JSON telemetry client
            └── main.c                # FreeRTOS sampling task & app_main
```

---

## 🛡️ License

Built for the CurrentZone / SmartWatt smart grid initiative.