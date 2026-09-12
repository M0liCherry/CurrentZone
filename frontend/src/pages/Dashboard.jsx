import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, Zap } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { devices as seed, weeklyUsage, recommendations } from '../data/mockData'
import { Switch, Snackbar } from '../components/ui'

export default function Dashboard() {
  const nav = useNavigate()
  const [devices, setDevices] = useState(seed)
  const [snack, setSnack] = useState('')
  const live = useMemo(() => {
    const on = devices.filter(d => d.on)
    const kw = on.reduce((s, d) => s + d.watts, 0) / 1000
    return { kw: kw.toFixed(2), count: on.length }
  }, [devices])

  const toggle = (id, v) => {
    setDevices(ds => ds.map(d => (d.id === id ? { ...d, on: v } : d)))
    const d = devices.find(x => x.id === id)
    setSnack(`${d.name} turned ${v ? 'on' : 'off'}`)
    setTimeout(() => setSnack(''), 2200)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="m3-label label-row"><Zap size={14} /> Live Usage Monitor</div>
          <h1 className="m3-display">Good evening, Leslie</h1>
          <p className="m3-body">Follow the steps to connect your smart plug and start monitoring energy usage.</p>
        </div>
        <div className="head-actions">
          <button className="m3-btn tonal" onClick={() => nav('/usage')}>View usage details <ArrowRight size={16} /></button>
          <button className="m3-btn filled" onClick={() => nav('/connect')}><Plus size={17} /> Connect Device</button>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="m3-card primary-tint">
          <div className="m3-label" style={{ color: 'inherit' }}>Live draw</div>
          <div className="kpi">{live.kw} kW</div>
          <div className="kpi-sub">{live.count} of {devices.length} devices on · real-time</div>
        </div>
        <div className="m3-card filled">
          <div className="m3-label">Today</div>
          <div className="kpi">28 kWh</div>
          <div className="kpi-sub"><span className="up">+20%</span> vs yesterday avg</div>
        </div>
        <div className="m3-card filled">
          <div className="m3-label">Estimated bill</div>
          <div className="kpi">$123.50</div>
          <div className="kpi-sub">Due Oct 15 · <Link to="/bills" className="link">Breakdown</Link></div>
        </div>
        <div className="m3-card filled">
          <div className="m3-label">Budget · October</div>
          <div className="kpi">$118 <span style={{ fontSize: '1rem', fontWeight: 400 }}>/ $150</span></div>
          <div className="m3-linear" style={{ marginTop: 10 }}><div style={{ width: '79%' }} /></div>
          <div className="kpi-sub" style={{ marginTop: 8 }}>79% used</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="m3-card">
          <div className="card-top">
            <div><h3 className="m3-headline">This week</h3><p className="m3-body">Daily consumption (kWh)</p></div>
            <button className="m3-btn text" onClick={() => nav('/usage')}>Details <ArrowRight size={15} /></button>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" />
                <XAxis dataKey="d" tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--md-sys-color-surface-container-highest)', border: 'none', borderRadius: 12 }} />
                <Area type="monotone" dataKey="kwh" stroke="var(--md-sys-color-primary)" fill="var(--md-sys-color-primary-container)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="m3-card">
          <div className="card-top">
            <div><h3 className="m3-headline">Devices</h3><p className="m3-body">Use a switch to toggle a plug</p></div>
            <button className="m3-btn text" onClick={() => nav('/devices')}>Manage <ArrowRight size={15} /></button>
          </div>
          <div className="m3-list">
            {devices.slice(0, 4).map(d => (
              <div className="m3-list-item" key={d.id}>
                <div className="leading"><d.icon size={22} /></div>
                <div className="meta"><b>{d.name}</b><span>{d.room} · {(d.watts / 1000).toFixed(2)} kW</span></div>
                <Switch checked={d.on} onChange={v => toggle(d.id, v)} label={d.name} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="m3-headline" style={{ margin: '28px 0 14px' }}>Connect your smart plug</h2>
      <div className="grid grid-3">
        {recommendations.slice(0, 6).map(r => (
          <div className="m3-card outlined" key={r.title}>
            <div className="leading"><r.icon size={22} /></div>
            <h4 className="m3-title" style={{ margin: '12px 0 4px' }}>{r.title}</h4>
            <p className="m3-body">{r.desc}</p>
          </div>
        ))}
      </div>
      <Snackbar message={snack} />
    </>
  )
}
