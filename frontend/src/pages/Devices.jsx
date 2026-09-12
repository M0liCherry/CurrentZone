import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plug, Plus, RefreshCw } from 'lucide-react'
import { deviceHistory } from '../data/mockData'
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
          <h1 className="m3-display">Devices</h1>
          <p className="m3-body">Toggle plugs, review per-device history.</p>
        </div>
        <button className="m3-btn filled" onClick={() => nav('/connect')}><Plus size={17} /> Add device</button>
      </div>
      <div className="grid grid-2">
        <div className="m3-card">
          <h3 className="m3-headline" style={{ marginBottom: 8 }}>SmartWatt devices</h3>
          <div className="m3-list">
            {devices.map(d => (
              <div className="m3-list-item" key={d.id}>
                <div className="leading"><d.icon size={22} /></div>
                <div className="meta"><b>{d.name}</b><span>{d.room} · {d.todayKwh} kWh today</span></div>
                <Switch checked={d.on} onChange={v => toggle(d.id, v)} label={d.name} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="m3-card filled">
            <h3 className="m3-headline" style={{ marginBottom: 8 }}>Device history</h3>
            {deviceHistory.map(h => (
              <div key={h.id}>
                <div className="m3-list-item">
                  <div className="leading"><h.icon size={22} /></div>
                  <div className="meta"><b>{h.name}</b><span>{h.range} · {h.kwh} kWh</span></div>
                  <button className="icon-btn" aria-label={`Open ${h.name} insights`} onClick={() => nav('/insights')}><ChevronRight size={20} /></button>
                </div>
                <div className="divider" />
              </div>
            ))}
            <div className="m3-card outlined" style={{ marginTop: 16 }}>
              <div className="m3-label">Tip</div>
              <p className="m3-body">Fridge ran 24/7 as expected. TV standby draw looks high — enable the standby killer from <b>Save Energy</b>.</p>
            </div>
          </div>
        </div>
      </div>
      <Snackbar message={snack} />
    </>
  )
}
