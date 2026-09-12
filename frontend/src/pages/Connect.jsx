import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, PlugZap, RefreshCw } from 'lucide-react'
import { Snackbar, Dialog } from '../components/ui'
import { recommendations } from '../data/mockData'
<<<<<<< HEAD
import {
  DEFAULT_DEVICE_ID,
  connectDevice,
  startDummyStream,
  latestTelemetry,
} from '../lib/api'
=======
import { api } from '../services/api'
>>>>>>> 0931b3ffcbb54bf8e324a4080cb28534dcb0c580

export default function Connect() {
  const nav = useNavigate()
  const [done, setDone] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connectedInfo, setConnectedInfo] = useState(null)
  const [snack, setSnack] = useState('')
<<<<<<< HEAD
  const [connecting, setConnecting] = useState(false)
  const [live, setLive] = useState(null)
  const [error, setError] = useState('')
  const pollRef = useRef(null)

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => stopPolling, [])

  const pollLive = () => {
    stopPolling()
    const fetchOnce = async () => {
      try {
        const data = await latestTelemetry()
        setLive(data)
      } catch {
        // Backend may still be starting — keep last reading.
      }
    }
    fetchOnce()
    pollRef.current = setInterval(fetchOnce, 3000)
  }

  const handleConnect = async () => {
    setConnecting(true)
    setError('')
    setSnack('Pairing smart plug…')
    try {
      // 1. Pair the device in the backend (creates it if needed).
      await connectDevice(DEFAULT_DEVICE_ID)
      // 2. Start the server-side dummy ESP stream so varying current
      //    readings flow into /api/telemetry/latest with no hardware.
      await startDummyStream(DEFAULT_DEVICE_ID)
      setSnack('Plug online — dummy current streaming.')
      setDone(true)
      pollLive()
    } catch (e) {
      setError(e.message || 'Could not reach backend. Is it running on :8000?')
      setSnack('Connect failed — is the backend running?')
    } finally {
      setConnecting(false)
      setTimeout(() => setSnack(''), 3000)
    }
  }

=======

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const deviceId = `plug_living_${Math.floor(1000 + Math.random() * 9000)}`
      const res = await api.connectDevice(deviceId)
      setConnectedInfo(res)
      setDone(true)
    } catch {
      setDone(true)
    } finally {
      setConnecting(false)
    }
  }
>>>>>>> 0931b3ffcbb54bf8e324a4080cb28534dcb0c580
  return (
    <>
      <div className="hero-band" style={{ marginTop: 8 }}>
        <div>
          <div className="m3-label label-row" style={{ color: 'inherit' }}><PlugZap size={14} /> Connect Smart Plug</div>
          <h1>Connect your smart plug</h1>
          <p>Follow the steps to connect your smart plug and start monitoring energy usage.</p>
          <div className="head-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="m3-btn filled invert" onClick={handleConnect} disabled={connecting}>
<<<<<<< HEAD
              {connecting ? 'Connecting…' : 'Connect Device'}
=======
              {connecting ? <RefreshCw size={16} className="spin" /> : null}
              {connecting ? 'Pairing Plug…' : 'Connect Device'}
>>>>>>> 0931b3ffcbb54bf8e324a4080cb28534dcb0c580
            </button>
            <button className="m3-btn outlined on-tint" onClick={() => nav('/')}><ArrowLeft size={16} /> Back to dashboard</button>
          </div>
          {error && <p className="m3-body" style={{ marginTop: 8, opacity: 0.9 }}>⚠️ {error} — start backend with `uv run uvicorn app.main:app --port 8000` in `backend/`.</p>}
          {live && (
            <div className="m3-card outlined" style={{ marginTop: 12, background: 'rgba(255,255,255,0.12)' }}>
              <div className="m3-label">Live dummy feed · {live.device_id || DEFAULT_DEVICE_ID}</div>
              <p className="m3-body" style={{ fontSize: 18, fontWeight: 700 }}>
                {Number(live.current_rms ?? 0).toFixed(2)} A · {Number(live.power_kw ?? 0).toFixed(2)} kW · {Number(live.load_pct ?? 0).toFixed(1)}% load
              </p>
              <p className="m3-body" style={{ opacity: 0.85 }}>Updates every 3 s from the backend dummy ESP stream.</p>
            </div>
          )}
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
        <Dialog title="Smart Plug Connected"
          onClose={() => setDone(false)}
          actions={<><button className="m3-btn text" onClick={() => setDone(false)}>Close</button><button className="m3-btn filled" onClick={() => { setDone(false); nav('/devices') }}>View devices</button></>}>
<<<<<<< HEAD
          <p>Your SmartWatt plug is online. Live dummy current is streaming to the backend — check the dashboard for real-time draw.</p>
=======
          <p>{connectedInfo?.message || 'Your SmartWatt plug is online. Live telemetry has started — check the dashboard for real-time draw.'}</p>
          {connectedInfo?.device_id && (
            <p className="m3-body" style={{ fontSize: '.84rem', marginTop: 8 }}>
              Registered ID: <code>{connectedInfo.device_id}</code> (Status: {connectedInfo.pairing_status})
            </p>
          )}
>>>>>>> 0931b3ffcbb54bf8e324a4080cb28534dcb0c580
        </Dialog>
      )}
      <Snackbar message={snack} />
    </>
  )
}
