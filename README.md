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

## 📱 SmartWatt Web Application (Frontend & Backend Integration)

The web frontend is a desktop-optimized React application crafted in **Google Material 3 (Material You)**, featuring dynamic color theming, clean Lucide iconography, interactive Recharts graphs, and responsive navigation (drawer → rail → bottom bar). It is directly linked to the FastAPI backend via a Vite reverse proxy.

```
                  ┌──────────────────────────────────────────────┐
                  │          React 18 + Vite Frontend            │
                  │   - Material 3 (Material You) Theme Studio   │
                  │   - Live Usage & Draw KPIs                   │
                  │   - AI Grid Outage Predictor & Simulator     │
                  │   - Appliance Insights & Billing History     │
                  │   - Smart Plug Control & Budgets             │
                  └──────────────────────┬───────────────────────┘
                                         │ Reverse Proxy (/api, /health)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │             FastAPI REST Backend             │
                  │   - SQLite Database & SQLAlchemy ORM         │
                  │   - IEEE C57.91 Transformer Thermal Physics  │
                  │   - Scikit-learn Outage Predictor            │
                  │   - Telemetry Ingestion (ESP32 SCT-013)      │
                  └──────────────────────────────────────────────┘
```

### Screen & Feature Catalog:

| Screen / Feature | Route | Description |
| :--- | :--- | :--- |
| **Live Dashboard** | `/` | Real-time draw (kW), active devices, today's kWh, estimated bill, budget progress, weekly consumption area chart, and the **AI Grid Outage Risk Banner**. |
| **AI Outage Predictor** | `/predictor` | **Flagship Feature**: Transformer health diagnostics (top-oil temp, load %, failure probability, TTF minutes) and an **Interactive Weather & Stress Simulator** to test heatwaves and overload scenarios against the ML model. |
| **Usage Details** | `/usage` | Daily consumption breakdown by time slots (12AM, 4AM, 8AM, 12PM, 4PM, 8PM), average daily use (28 kWh, +20%), peak hour analysis, weekly bar chart, and 12-month annual area chart. |
| **Devices & Plugs** | `/devices` | Real-time device toggles (Smart Fridge, TV, AC, Lamp, Fan), power draw (W), daily kWh stats, historical device consumption, and pairing links. |
| **Appliance Insights** | `/insights` | Bedroom energy consumption overview: AC (45 kWh / 37.5%), Fan (30 kWh / 25%), Light (25 kWh / 20.8%), peak consumption gauge, and review rating distribution. |
| **Cost Estimation & Bills** | `/bills` | Current estimated cycle bill ($123.50, due Oct 15), payment history table (Paid status), estimated monthly savings ($20.00), and green energy transition options. |
| **Budgets & Alerts** | `/budget` | Monthly budget manager (USD), visual linear consumption gauge, 80% & 100% threshold alert notifications, and multi-channel alert options (Push, Email, SMS). |
| **Save Energy Hub** | `/recommendations` | 7-point efficiency guide and high-impact energy saving tips (eco mode water heater, AC setpoint tuning, phantom standby elimination). |
| **Notification Center** | `/notifications` | Notification tray synchronizing real-time grid alerts, budget overruns, and device anomalies with mark-as-read backend persistence. |
| **Connect Plug** | `/connect` | Guided 6-step smart plug pairing hero band and live device registration modal connecting directly to the backend database. |
| **Theme Studio** | Modal / TopBar | Google Material You dynamic color generator with 8 curated seeds, custom hex picker, and dark/light brightness modes persisted to `localStorage`. |
| **Settings** | `/settings` | Profile management (Leslie Rasmund), account info, privacy controls, and support access. |

---

## ⚙️ How the System Works (End-to-End Workflow)

```
[1. SENSING]
  Robocraze SCT-013 100A non-invasive CT sensor clamps onto distribution transformer line or appliance lead.
    │
    ▼
[2. EDGE SAMPLING]
  ESP32 microcontroller samples analog waveform at 500 samples/window, computes true RMS current (I_rms),
  active power (Watts), and energy (kWh).
    │
    ▼ (HTTP POST JSON Telemetry)
[3. BACKEND INGESTION & GRID MONITORING]
  FastAPI backend validates telemetry at `/api/telemetry/ingest`, updates device records in SQLite,
  and syncs localized ambient weather data (heat index, storm wind gusts, lightning index).
    │
    ▼
[4. PHYSICS & MACHINE LEARNING INFERENCE]
  - IEEE C57.91 Thermal Engine calculates top-oil temperature and hot-spot temperature rise.
  - Surge Velocity Engine ($dI/dt$) flags uncharacteristic demand spikes.
  - Outage Prediction Model evaluates failure probability (0–100%) and forecasts Time-to-Failure (TTF).
    │
    ▼ (Reverse Proxy /api)
[5. MATERIAL 3 WEB USER INTERFACE]
  - Dashboard alerts users to elevated grid risk before power cuts occur.
  - Operators can run interactive simulations to forecast grid behavior under extreme heat or storms.
  - Homeowners monitor live draw, toggle smart plugs, track monthly budgets, and analyze appliance efficiency.
  - Automatic fallback ensures the UI works offline in "Mock Mode" if the server is stopped.
```

---

## 🚀 Getting Started & Running Locally

### 1. Prerequisites
- **Node.js**: `>= 18.x`
- **Python**: `>= 3.12` with [`uv`](https://github.com/astral-sh/uv) or virtual environment
- **ESP-IDF** (optional, for ESP32 hardware): `v5.x` or `v6.x`

### 2. Running Both Frontend & Backend (Unified)

From the project root directory:

```bash
# 1. Install frontend dependencies
npm --prefix frontend install

# 2. Setup backend virtual environment and dependencies
cd backend
uv venv
source .venv/bin/activate
uv pip install -e .
cd ..

# 3. Launch both backend (port 8000) and frontend (port 5173) concurrently:
npm run dev
```

The application will be accessible at:
- **Web App**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **API Swagger Documentation**: `http://localhost:8000/docs`

---

### 3. Running Services Independently

#### Backend Only:
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Only:
```bash
cd frontend
npm install
npm run dev
```

> **Note on Zero-Breakage Offline Mode**: The frontend features an automatic health detector. If the backend is running, the top bar displays a green **`Backend Online`** badge. If the backend is stopped, the frontend seamlessly operates in **`Mock Mode`** with local data, ensuring uninterrupted development and demonstration.

---

### 4. Running Backend Tests & Validation

```bash
# Run pytest test suite (10/10 tests passing)
npm run test

# Build frontend production bundle (Vite)
npm run build:frontend
```

---

### 5. Compiling & Flashing ESP32 Firmware
```bash
# Activate ESP-IDF environment
source /home/nate/Projects/esp/esp-idf/export.sh

# Navigate to esp directory
cd backend/esp

# Build firmware
idf.py build

# Flash to ESP32 device
idf.py -p /dev/ttyUSB0 flash monitor
```

---

### 6. Simulating Outage Scenarios via cURL
You can test the failure prediction engine under severe simulated conditions (e.g. 42°C heatwave + 72 km/h wind gusts + 115A overload) directly:

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

---

## 📂 Project Structure

```
Current_Zone/
├── README.md                  # Complete project guide & architecture
├── package.json               # Unified scripts to run frontend & backend concurrently
├── .gitignore                 # Git ignore rules for Python, Node.js & ESP-IDF
├── design_exports/            # Exported Figma UI screens & flowcharts
│
├── frontend/                  # React 18 + Vite Web Application
│   ├── README.md              # Frontend architecture & Material 3 design guide
│   ├── package.json           # React, Vite, Recharts, Lucide-react dependencies
│   ├── vite.config.js         # Vite configuration with /api & /health reverse proxy
│   ├── index.html             # HTML entry point
│   └── src/
│       ├── main.jsx           # App bootstrap
│       ├── App.jsx            # Shell, Router & Dialog handlers
│       ├── index.css          # Material 3 design system & typography tokens
│       ├── color.js           # Dynamic Material You color engine
│       ├── theme.jsx          # Theme provider & persistent localStorage hooks
│       ├── services/
│       │   └── api.js         # Unified API client with automatic fallback to mock data
│       ├── data/
│       │   └── mockData.js    # Seed datasets & fallback records
│       ├── components/
│       │   ├── Navigation.jsx # Drawer (desktop) / Rail (tablet) / BottomBar (mobile)
│       │   ├── TopBar.jsx     # App bar with search & live Backend Online indicator
│       │   ├── ThemeDialog.jsx# Material You seed color & dark/light picker
│       │   └── ui.jsx         # M3 components (Switch, Dialog, Snackbar)
│       └── pages/
│           ├── Dashboard.jsx  # Live monitor, KPIs & Outage Risk alert
│           ├── Predictor.jsx  # AI Outage Predictor & Severe Weather Simulator
│           ├── Usage.jsx      # Daily, weekly & monthly consumption analytics
│           ├── Devices.jsx    # Smart plug controls & consumption history
│           ├── Insights.jsx   # Appliance breakdown & rating benchmarks
│           ├── Bills.jsx      # Cost estimation & past billing cycles
│           ├── Budget.jsx     # Budget management & threshold alerts
│           ├── Recommendations.jsx # Energy efficiency recommendations
│           ├── Notifications.jsx   # Alert center with mark-as-read sync
│           ├── Connect.jsx    # Smart plug pairing wizard & live registration
│           └── Settings.jsx   # User profile & system preferences
│
└── backend/                   # FastAPI Backend & ESP-IDF Firmware
    ├── README.md              # Backend & hardware detailed guide
    ├── pyproject.toml         # Dependencies & configuration (uv)
    ├── smartwatt.db           # SQLite database for devices, telemetry & users
    ├── tests/
    │   └── test_api.py        # 10 integration & algorithm tests (pytest)
    ├── app/
    │   ├── main.py            # FastAPI entry point & CORS configuration
    │   ├── config.py          # Grid, sensor & threshold settings
    │   ├── database.py        # SQLAlchemy engine & session management
    │   ├── seed_data.py       # Grid topology & demo account seeding
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
    │   └── routers/           # FastAPI REST endpoints
    │       ├── auth.py        # Authentication & profile endpoints
    │       ├── billing.py     # Billing & cost estimation
    │       ├── budgets.py     # Budget limits & alert thresholds
    │       ├── devices.py     # Smart plug telemetry & pairing
    │       ├── insights.py    # Appliance breakdown
    │       ├── notifications.py # Notification tray
    │       ├── predictor.py   # Transformer risk & scenario simulation
    │       ├── telemetry.py   # Ingestion for ESP32 SCT-013 sensor
    │       └── usage.py       # Daily/weekly/monthly kWh analytics
    └── esp/                   # ESP-IDF C Project for ESP32
        ├── CMakeLists.txt     # Root CMake configuration
        ├── sdkconfig.defaults # Hardware defaults & FreeRTOS settings
        └── main/
            ├── sct013.h / .c         # Robocraze SCT-013 100A ADC driver
            ├── wifi_station.h / .c   # Wi-Fi station with auto-reconnect
            ├── telemetry_client.h / .c # HTTP JSON telemetry client
            └── main.c                # FreeRTOS sampling task & app_main
```

---

## 🛡️ License

Built for the CurrentZone / SmartWatt smart grid and intelligent energy monitoring initiative.