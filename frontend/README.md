# CurrentZone — SmartWatt Energy Web App (Material 3)

Desktop-optimized React web app built from the 10 phone-screen references, restyled in **Google Material 3 (Material You)** with dynamic color, clean Lucide icons, and responsive layouts (drawer → rail → bottom bar).

## Screens → Pages
| Reference image | Web page (route) |
|---|---|
| Connect Device.png | `/connect` — onboarding hero + 6 steps + connect dialog |
| Cost Estimation.png | `/bills` — current bill $123.50, past bills, $20 savings, green-energy promo |
| History.png | `/devices` — toggles for Fridge/TV/Lamp + device history |
| Insight.png | `/insights` — 120 kWh total, plug bars, 50 kWh peak, 4.5★ ratings, splits |
| Budget & Alerts.png | `/budget` — budget form, progress, alert prefs |
| Notifications.png | `/notifications` — notification center (desktop adaptation) |
| Save Energy.png | `/recommendations` — 7-item hub + saving tips |
| Settings.png | `/settings` — Leslie Rasmund profile, appearance, privacy, support |
| Usage Monitoring.png | `/usage` — daily/weekly/monthly charts |
| Logout.png | Logout dialog (drawer / rail / recommendations button) |
| Save Energy menu shell | `/` Dashboard — live monitor + KPIs + charts |

## Material 3 implementation
- **Theme studio** (palette icon in top bar, or Settings → Appearance): Material-You-style seed color picker (8 curated seeds + custom color input), light/dark brightness switch, live component preview. Seed + mode persist to localStorage; palettes are generated in `src/color.js` using M3-spec tones.
- M3 type scale, 28px cards, full-rounded buttons/chips, FAB, segmented buttons.
- M3 navigation drawer (desktop) → rail (tablet) → bottom bar (mobile).
- M3 switch, dialog, snackbar, linear progress, list items, text fields, top app bar.
- Icons: `lucide-react` throughout (no emoji).

## Run
```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
npm run build
```
