import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plug, Plus, Zap } from 'lucide-react'
import { Switch, Snackbar } from '../components/ui'
import { api } from '../services/api'

export default function Devices() {
  const nav = useNavigate()
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [snack, setSnack] = useState('')

  const loadDevices = async () => {
    setLoading(true)
    try {
      const data = await api.getDevices()
      setDevices(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDevices()
    const interval = setInterval(async () => {
      try {
        const data = await api.getDevices()
        setDevices(data)
      } catch {
        // ignore polling err
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const toggle = async (id, v) => {
    setDevices(ds => ds.map(d => (d.id === id ? { ...d, on: v } : d)))
    const d = devices.find(x => x.id === id)
    setSnack(`${d?.name || 'Device'} ${v ? 'connected' : 'paused'}`)
    try {
      if (v) await api.connectDevice(id)
    } catch {
      // offline fallback
    }
    setTimeout(() => setSnack(''), 2000)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="m3-label label-row"><Plug size={14} /> History · SmartWatt Devices</div>
          <h1 className="m3-display">Devices &amp; Sensors</h1>
          <p className="m3-body">Connected ESP32 sensors and smart plugs reporting real-time telemetry.</p>
        </div>
        <button className="m3-btn filled" onClick={() => nav('/connect')}><Plus size={17} /> Add device / sensor</button>
      </div>

      <div className="grid grid-2">
        <div className="m3-card">
          <h3 className="m3-headline" style={{ marginBottom: 8 }}>Connected devices</h3>
          {devices.length > 0 ? (
            <div className="m3-list">
              {devices.map(d => (
                <div className="m3-list-item" key={d.id}>
                  <div className="leading"><d.icon size={22} /></div>
                  <div className="meta">
                    <b>{d.name}</b>
                    <span>{d.room} · {((d.watts || 0) / 1000).toFixed(2)} kW ({d.currentAmps || 0} A) · {d.todayKwh} kWh today</span>
                  </div>
                  <Switch checked={d.on} onChange={v => toggle(d.id, v)} label={d.name} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <Plug size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
              <h4 className="m3-title">No devices registered</h4>
              <p className="m3-body" style={{ opacity: 0.8, maxWidth: 360, margin: '6px auto 16px' }}>
                Connect an ESP32 SCT-013 current sensor or smart plug to begin streaming real-time power data.
              </p>
              <button className="m3-btn filled" onClick={() => nav('/connect')}>
                <Plus size={16} /> Connect Device
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="m3-card filled">
            <h3 className="m3-headline" style={{ marginBottom: 8 }}>Device activity</h3>
            {devices.length > 0 ? (
              devices.map(d => (
                <div key={d.id}>
                  <div className="m3-list-item">
                    <div className="leading"><d.icon size={22} /></div>
                    <div className="meta">
                      <b>{d.name}</b>
                      <span>{d.on ? 'Streaming live' : 'Offline / Paused'} · {d.todayKwh} kWh</span>
                    </div>
                    <button className="icon-btn" aria-label={`Open ${d.name} insights`} onClick={() => nav('/insights')}>
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <div className="divider" />
                </div>
              ))
            ) : (
              <p className="m3-body" style={{ opacity: 0.8, padding: '16px 0' }}>
                No active device telemetry history. Telemetry will appear here once incoming data arrives on <code>/api/telemetry/ingest</code>.
              </p>
            )}

            <div className="m3-card outlined" style={{ marginTop: 16 }}>
              <div className="m3-label"><Zap size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Hardware Ingestion Tip</div>
              <p className="m3-body">
                The ESP32 firmware in <code>backend/esp</code> continuously samples your SCT-013 sensor and transmits RMS current directly to this platform.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Snackbar message={snack} />
    </>
  )
}
