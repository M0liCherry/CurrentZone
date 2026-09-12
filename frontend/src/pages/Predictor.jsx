import { useEffect, useState } from 'react'
import {
  Activity, AlertTriangle, CheckCircle, Flame, RefreshCw, ShieldAlert,
  Sliders, Thermometer, Wind, Zap
} from 'lucide-react'
import { api } from '../services/api'
import { Snackbar } from '../components/ui'

export default function Predictor() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [snack, setSnack] = useState('')

  // Simulator state
  const [zone, setZone] = useState('Residential South')
  const [transformerId, setTransformerId] = useState('TX-RES-01')
  const [ambientTemp, setAmbientTemp] = useState(38)
  const [windGust, setWindGust] = useState(45)
  const [currentRms, setCurrentRms] = useState(115)
  const [rainMm, setRainMm] = useState(25)
  const [simLoading, setSimLoading] = useState(false)
  const [simResult, setSimResult] = useState(null)

  const fetchOverview = async () => {
    setLoading(true)
    try {
      const data = await api.getGridOverview()
      setOverview(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOverview()
    const interval = setInterval(async () => {
      try {
        const data = await api.getGridOverview()
        setOverview(data)
      } catch {
        // ignore background poll errors
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const runSimulation = async (e) => {
    if (e) e.preventDefault()
    setSimLoading(true)
    try {
      const res = await api.simulateScenario({
        zone,
        transformer_id: transformerId,
        ambient_temp_c: Number(ambientTemp),
        wind_gust_kmh: Number(windGust),
        current_rms: Number(currentRms),
        rain_mm: Number(rainMm),
      })
      setSimResult(res)
      setSnack(`Simulation complete: ${res.risk_level} risk predicted`)
    } catch (err) {
      setSnack('Simulation failed')
    } finally {
      setSimLoading(false)
      setTimeout(() => setSnack(''), 3000)
    }
  }

  const getRiskColor = (level = '') => {
    switch (level.toUpperCase()) {
      case 'CRITICAL':
        return 'var(--md-sys-color-error)'
      case 'HIGH':
        return '#f59e0b'
      case 'MODERATE':
        return '#eab308'
      default:
        return 'var(--md-sys-color-primary)'
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="m3-label label-row">
            <ShieldAlert size={14} /> AI Failure Forecasting · IEEE C57.91 Physics
          </div>
          <h1 className="m3-display">Electricity Outage Predictor</h1>
          <p className="m3-body">
            Proactive transformer thermal analysis, grid surge dynamics, and ML failure forecasting.
          </p>
        </div>
        <div className="head-actions">
          <button className="m3-btn tonal" onClick={fetchOverview} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Grid Overview KPIs */}
      <div className="grid grid-4">
        <div className="m3-card primary-tint">
          <div className="m3-label" style={{ color: 'inherit' }}>Grid Status</div>
          <div className="kpi" style={{ fontSize: '1.8rem' }}>
            {overview?.overall_grid_status || 'STABLE'}
          </div>
          <div className="kpi-sub">
            {overview?.monitored_transformers_count ?? overview?.zones?.length ?? 0} Distribution Transformers
          </div>
        </div>

        <div className="m3-card filled">
          <div className="m3-label">Critical At-Risk Zones</div>
          <div className="kpi" style={{ color: overview?.critical_risk_zones > 0 ? 'var(--md-sys-color-error)' : 'inherit' }}>
            {overview?.critical_risk_zones || 0}
          </div>
          <div className="kpi-sub">
            {overview?.high_risk_zones || 0} Elevated Risk Zones
          </div>
        </div>

        <div className="m3-card filled">
          <div className="m3-label">Ambient Heat Index</div>
          <div className="kpi">
            {overview?.ambient_heat_index != null ? `${overview.ambient_heat_index.toFixed(1)}°C` : '—'}
          </div>
          <div className="kpi-sub">
            <Thermometer size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Degrades transformer cooling
          </div>
        </div>

        <div className="m3-card filled">
          <div className="m3-label">Max Wind Gust</div>
          <div className="kpi">
            {overview?.max_wind_gust_kmh != null ? `${overview.max_wind_gust_kmh.toFixed(0)} km/h` : '—'}
          </div>
          <div className="kpi-sub">
            <Wind size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Tree hazard threshold: 50 km/h
          </div>
        </div>
      </div>

      {/* Zone Risk Cards */}
      <h2 className="m3-headline" style={{ margin: '28px 0 14px' }}>
        Live Transformer Health &amp; Risk Profiles
      </h2>
      <div className="grid grid-2">
        {(overview?.zones || []).map((z) => (
          <div className="m3-card outlined" key={z.transformer_id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card-top">
              <div>
                <span className="m3-chip" style={{ marginBottom: 6 }}>{z.transformer_id}</span>
                <h3 className="m3-title">{z.transformer_name}</h3>
                <p className="m3-body">Zone: {z.zone}</p>
              </div>
              <span
                className="status-pill"
                style={{
                  background: `${getRiskColor(z.risk_level)}20`,
                  color: getRiskColor(z.risk_level),
                  fontWeight: 700,
                }}
              >
                {z.risk_level} RISK
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', marginBottom: 4 }}>
                <span>Failure Probability</span>
                <b>{z.failure_probability_pct?.toFixed(1)}%</b>
              </div>
              <div className="m3-linear">
                <div
                  style={{
                    width: `${Math.min(100, z.failure_probability_pct || 0)}%`,
                    background: getRiskColor(z.risk_level),
                  }}
                />
              </div>
            </div>

            <div className="grid grid-3" style={{ gap: 10, marginTop: 4 }}>
              <div className="m3-card filled" style={{ padding: '10px 14px' }}>
                <div className="m3-label" style={{ fontSize: '.72rem' }}>Load</div>
                <b>{z.current_load_pct?.toFixed(0)}%</b>
              </div>
              <div className="m3-card filled" style={{ padding: '10px 14px' }}>
                <div className="m3-label" style={{ fontSize: '.72rem' }}>Oil Temp</div>
                <b>{z.top_oil_temp_c?.toFixed(1)}°C</b>
              </div>
              <div className="m3-card filled" style={{ padding: '10px 14px' }}>
                <div className="m3-label" style={{ fontSize: '.72rem' }}>Est. TTF</div>
                <b>{z.estimated_ttf_minutes ? `${z.estimated_ttf_minutes} min` : 'Nominal'}</b>
              </div>
            </div>

            {z.all_mitigations && z.all_mitigations.length > 0 && (
              <div style={{ marginTop: 4, background: 'var(--md-sys-color-surface-container-low)', padding: 12, borderRadius: 12 }}>
                <div className="m3-label" style={{ marginBottom: 4 }}>Recommended Mitigation</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '.84rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {z.all_mitigations.slice(0, 2).map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Interactive Scenario Simulator */}
      <h2 className="m3-headline" style={{ margin: '36px 0 14px' }}>
        Interactive Stress &amp; Severe Weather Simulator
      </h2>
      <p className="m3-body" style={{ marginBottom: 16 }}>
        Test transformer resiliency under heatwave temperatures, storm wind gusts, and peak load surges.
      </p>

      <div className="grid grid-2">
        <form className="m3-card" onSubmit={runSimulation}>
          <div className="card-top">
            <h3 className="m3-headline">Scenario Parameters</h3>
            <span className="m3-chip"><Sliders size={14} /> IEEE C57.91</span>
          </div>

          <div className="m3-field" style={{ marginTop: 12 }}>
            <label htmlFor="sim-zone">Target Zone &amp; Transformer</label>
            <select
              id="sim-zone"
              value={transformerId}
              onChange={(e) => {
                const selected = overview?.zones?.find(z => z.transformer_id === e.target.value)
                setTransformerId(e.target.value)
                if (selected) setZone(selected.zone)
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid var(--md-sys-color-outline)',
                background: 'var(--md-sys-color-surface-container)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            >
              {(overview?.zones && overview.zones.length > 0) ? (
                overview.zones.map((z) => (
                  <option key={z.transformer_id} value={z.transformer_id}>
                    {z.transformer_id} ({z.zone})
                  </option>
                ))
              ) : (
                <option value="TX-RES-01">TX-RES-01 (Residential South)</option>
              )}
            </select>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.88rem' }}>
              <span>Ambient Heat: <b>{ambientTemp}°C</b></span>
              <span className="m3-body">Extreme heat accelerates oil aging</span>
            </div>
            <input
              type="range"
              min="15"
              max="50"
              value={ambientTemp}
              onChange={(e) => setAmbientTemp(e.target.value)}
              style={{ width: '100%', margin: '8px 0' }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.88rem' }}>
              <span>AC Current Load: <b>{currentRms} A</b></span>
              <span className="m3-body">Rated: 100A</span>
            </div>
            <input
              type="range"
              min="30"
              max="160"
              value={currentRms}
              onChange={(e) => setCurrentRms(e.target.value)}
              style={{ width: '100%', margin: '8px 0' }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.88rem' }}>
              <span>Storm Wind Gusts: <b>{windGust} km/h</b></span>
              <span className="m3-body">&gt;50 km/h = Conductor hazard</span>
            </div>
            <input
              type="range"
              min="0"
              max="110"
              value={windGust}
              onChange={(e) => setWindGust(e.target.value)}
              style={{ width: '100%', margin: '8px 0' }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.88rem' }}>
              <span>Precipitation / Rain: <b>{rainMm} mm</b></span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              value={rainMm}
              onChange={(e) => setRainMm(e.target.value)}
              style={{ width: '100%', margin: '8px 0' }}
            />
          </div>

          <button
            type="submit"
            className="m3-btn filled"
            style={{ width: '100%', marginTop: 20 }}
            disabled={simLoading}
          >
            {simLoading ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}
            Simulate Grid Failure Risk
          </button>
        </form>

        {/* Simulation Output Card */}
        <div>
          <div className="m3-card primary-tint" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="card-top">
              <h3 className="m3-headline">Simulation Forecast</h3>
              {simResult ? (
                <span
                  className="status-pill"
                  style={{
                    background: getRiskColor(simResult.risk_level),
                    color: '#fff',
                  }}
                >
                  {simResult.risk_level}
                </span>
              ) : (
                <span className="m3-chip">Awaiting Simulation</span>
              )}
            </div>

            {simResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div className="m3-label">Predicted Failure Probability</div>
                  <div
                    style={{
                      fontSize: '3.2rem',
                      fontWeight: 800,
                      color: getRiskColor(simResult.risk_level),
                      lineHeight: 1.1,
                    }}
                  >
                    {simResult.failure_probability_pct?.toFixed(1)}%
                  </div>
                  <div className="m3-body" style={{ marginTop: 6 }}>
                    {simResult.estimated_ttf_minutes
                      ? `⚠️ Estimated Time-to-Failure: ~${simResult.estimated_ttf_minutes} minutes`
                      : '✅ No immediate catastrophic trip forecasted'}
                  </div>
                </div>

                <div className="grid grid-2" style={{ gap: 10 }}>
                  <div className="m3-card filled">
                    <div className="m3-label">Simulated Load</div>
                    <div className="kpi" style={{ fontSize: '1.4rem' }}>{simResult.simulated_load_pct}%</div>
                  </div>
                  <div className="m3-card filled">
                    <div className="m3-label">Simulated Top-Oil Temp</div>
                    <div className="kpi" style={{ fontSize: '1.4rem' }}>{simResult.simulated_oil_temp_c}°C</div>
                  </div>
                </div>

                {simResult.primary_factors && simResult.primary_factors.length > 0 && (
                  <div className="m3-card filled">
                    <h4 className="m3-title-sm" style={{ marginBottom: 6 }}>Root Threat Factors</h4>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: '.85rem' }}>
                      {simResult.primary_factors.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {simResult.mitigation_actions && simResult.mitigation_actions.length > 0 && (
                  <div className="m3-card filled" style={{ background: 'var(--md-sys-color-surface-container-high)' }}>
                    <h4 className="m3-title-sm" style={{ marginBottom: 6 }}>Automated Mitigation Directives</h4>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: '.85rem' }}>
                      {simResult.mitigation_actions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: 30,
                  opacity: 0.75,
                }}
              >
                <ShieldAlert size={56} style={{ marginBottom: 12 }} />
                <h4 className="m3-title">Run a Scenario</h4>
                <p className="m3-body">
                  Adjust ambient temperature and electrical current load to compute failure probabilities.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Snackbar message={snack} />
    </>
  )
}
