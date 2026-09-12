import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Cpu, PlugZap, RefreshCw, Radio } from 'lucide-react'
import { Snackbar, Dialog } from '../components/ui'
import { recommendations } from '../constants/tips'
import { DEFAULT_DEVICE_ID, connectDevice, latestTelemetry } from '../lib/api'

export default function Connect() {
  const nav = useNavigate()
  const [deviceIdInput, setDeviceIdInput] = useState(DEFAULT_DEVICE_ID)
  const [done, setDone] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connectedInfo, setConnectedInfo] = useState(null)
  const [live, setLive] = useState(null)
  const [error, setError] = useState('')
  const [snack, setSnack] = useState('')
  const pollRef = useRef(null)

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => {
    // Initial fetch of latest telemetry
    latestTelemetry()
      .then(data => setLive(data))
      .catch(() => setLive(null))

    // Poll every 2 seconds for real incoming telemetry
    pollRef.current = setInterval(async () => {
      try {
        const data = await latestTelemetry()
        setLive(data)
      } catch {
        setLive(null)
      }
    }, 2000)

    return stopPolling
  }, [])

  const handleConnect = async () => {
    setConnecting(true)
    setError('')
    setSnack('Registering device…')
    try {
      const res = await connectDevice(deviceIdInput.trim() || DEFAULT_DEVICE_ID)
      setConnectedInfo(res)
      setSnack('Device registered — awaiting live sensor telemetry.')
      setDone(true)
    } catch (e) {
      setError(e.message || 'Could not reach backend. Is it running on port 8000?')
      setSnack('Connection failed — check backend status.')
    } finally {
      setConnecting(false)
      setTimeout(() => setSnack(''), 3000)
    }
  }

  return (
    <>
      <div className="hero-band" style={{ marginTop: 8 }}>
        <div>
          <div className="m3-label label-row" style={{ color: 'inherit' }}>
            <PlugZap size={14} /> Hardware Sensor &amp; Device Ingestion
          </div>
          <h1>Connect ESP32 / External Device</h1>
          <p>
            Pair your physical ESP32 SCT-013 current sensor or smart plug. Once paired, live sensor telemetry streams directly from your hardware to the predictor and usage engine.
          </p>
          
          <div style={{ margin: '14px 0', maxWidth: 420 }}>
            <label className="m3-label" style={{ color: 'inherit', marginBottom: 4, display: 'block' }}>
              Device Identifier (matching ESP32 firmware DEVICE_ID)
            </label>
            <input
              type="text"
              value={deviceIdInput}
              onChange={e => setDeviceIdInput(e.target.value)}
              placeholder="e.g., esp32_sct013_res_01"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.15)',
                color: 'inherit',
                fontSize: 14,
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
          </div>

          <div className="head-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="m3-btn filled invert" onClick={handleConnect} disabled={connecting}>
              {connecting ? <RefreshCw size={16} className="spin" /> : <Radio size={16} />}
              {connecting ? 'Pairing Device…' : 'Register / Pair Device'}
            </button>
            <button className="m3-btn outlined on-tint" onClick={() => nav('/')}>
              <ArrowLeft size={16} /> Back to dashboard
            </button>
          </div>

          {error && (
            <p className="m3-body" style={{ marginTop: 8, opacity: 0.9 }}>
              ⚠️ {error}
            </p>
          )}

          {/* Live Sensor Ingestion Status */}
          <div className="m3-card outlined" style={{ marginTop: 16, background: 'rgba(255,255,255,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="m3-label" style={{ color: 'inherit' }}>
                <Cpu size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Real-Time Telemetry · {live?.device_id || deviceIdInput}
              </div>
              <span className="status-pill" style={{ background: live ? '#10b981' : 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '.75rem' }}>
                {live ? 'STREAM ACTIVE' : 'AWAITING HARDWARE'}
              </span>
            </div>

            {live ? (
              <div style={{ marginTop: 8 }}>
                <p className="m3-body" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                  {Number(live.current_rms ?? 0).toFixed(2)} A · {Number(live.power_kw ?? 0).toFixed(2)} kW · {Number(live.load_pct ?? 0).toFixed(1)}% load
                </p>
                <p className="m3-body" style={{ opacity: 0.85, fontSize: '.8rem', margin: '4px 0 0' }}>
                  Voltage: {live.voltage_v || 230} V · Transformer: {live.transformer_id || 'TX-RES-01'} · Timestamp: {new Date(live.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ) : (
              <p className="m3-body" style={{ opacity: 0.85, marginTop: 8 }}>
                No telemetry received yet. Flash your ESP32 with <code>backend/esp</code> and point <code>BACKEND_POST_URL</code> to <code>/api/telemetry/ingest</code>.
              </p>
            )}
          </div>
        </div>
        <div className="promo-img"><PlugZap size={56} /></div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        {recommendations.slice(0, 6).map((s, i) => (
          <div className="m3-card filled step-card" key={s.title}>
            <div className="leading"><s.icon size={22} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="m3-body">Step {i + 1}</div>
              <h4 className="m3-title">{s.title}</h4>
              <p className="m3-body">{s.desc}</p>
            </div>
            <span className="trailing"><ChevronRight size={20} /></span>
          </div>
        ))}
      </div>

      {done && (
        <Dialog
          title="Device Paired"
          onClose={() => setDone(false)}
          actions={
            <>
              <button className="m3-btn text" onClick={() => setDone(false)}>Close</button>
              <button className="m3-btn filled" onClick={() => { setDone(false); nav('/devices') }}>View devices</button>
            </>
          }
        >
          <p>{connectedInfo?.message || 'Device registered successfully. Ready to receive real-time sensor measurements.'}</p>
          {connectedInfo?.device_id && (
            <p className="m3-body" style={{ fontSize: '.84rem', marginTop: 8 }}>
              Device ID: <code>{connectedInfo.device_id}</code> (Status: {connectedInfo.pairing_status})
            </p>
          )}
        </Dialog>
      )}
      <Snackbar message={snack} />
    </>
  )
}
