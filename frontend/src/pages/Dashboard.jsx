import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, ShieldAlert, Zap } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { recommendations } from '../data/mockData'
import { Switch, Snackbar } from '../components/ui'
import { api } from '../services/api'

export default function Dashboard() {
  const nav = useNavigate()
  const [devices, setDevices] = useState([])
  const [daily, setDaily] = useState({ averageDailyUseKwh: 28, dailyChangePct: 20 })
  const [weekly, setWeekly] = useState([])
  const [billing, setBilling] = useState({ current: { amount: 123.5, due: 'Due Oct 15' } })
  const [budget, setBudget] = useState({ monthlyBudget: 150, currentSpent: 118, percentageUsed: 79 })
  const [grid, setGrid] = useState(null)
  const [user, setUser] = useState({ name: 'Leslie' })
  const [snack, setSnack] = useState('')

  useEffect(() => {
    let mounted = true
    api.getDevices().then(ds => mounted && setDevices(ds))
    api.getDailyUsage().then(d => mounted && setDaily(d))
    api.getWeeklyUsage().then(w => mounted && setWeekly(w.chart))
    api.getBillingSummary().then(b => mounted && setBilling(b))
    api.getBudget().then(b => mounted && setBudget(b))
    api.getGridOverview().then(g => mounted && setGrid(g))
    api.getUserProfile().then(u => mounted && setUser(u))
    return () => { mounted = false }
  }, [])

  const live = useMemo(() => {
    const on = devices.filter(d => d.on)
    const kw = on.reduce((s, d) => s + (d.watts || 0), 0) / 1000
    return { kw: kw.toFixed(2), count: on.length }
  }, [devices])

  const toggle = async (id, v) => {
    setDevices(ds => ds.map(d => (d.id === id ? { ...d, on: v } : d)))
    const d = devices.find(x => x.id === id)
    setSnack(`${d?.name || 'Device'} turned ${v ? 'on' : 'off'}`)
    try {
      if (v) await api.connectDevice(id)
    } catch {
      // offline fallback
    }
    setTimeout(() => setSnack(''), 2200)
  }

  const firstName = user.name ? user.name.split(' ')[0] : 'Leslie'

  return (
    <>
      <div className="page-head">
        <div>
          <div className="m3-label label-row"><Zap size={14} /> Live Usage Monitor</div>
          <h1 className="m3-display">Good evening, {firstName}</h1>
          <p className="m3-body">SmartWatt intelligent energy monitoring &amp; grid failure prevention.</p>
        </div>
        <div className="head-actions">
          <button className="m3-btn tonal" onClick={() => nav('/usage')}>View usage details <ArrowRight size={16} /></button>
          <button className="m3-btn filled" onClick={() => nav('/connect')}><Plus size={17} /> Connect Device</button>
        </div>
      </div>

      {/* AI Outage Risk Banner */}
      {grid && (
        <div
          className="m3-card outlined"
          style={{
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            borderLeft: `5px solid ${grid.critical_risk_zones > 0 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)'}`,
            padding: '14px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: 'var(--md-sys-color-primary-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--md-sys-color-on-primary-container)',
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <b style={{ fontSize: '.95rem' }}>AI Grid Outage Predictor</b>
                <span
                  className="status-pill"
                  style={{
                    background: grid.critical_risk_zones > 0 ? 'var(--md-sys-color-error-container)' : 'var(--md-sys-color-secondary-container)',
                    color: grid.critical_risk_zones > 0 ? 'var(--md-sys-color-on-error-container)' : 'var(--md-sys-color-on-secondary-container)',
                  }}
                >
                  {grid.overall_grid_status || 'STABLE'}
                </span>
              </div>
              <p className="m3-body" style={{ margin: 0, fontSize: '.82rem' }}>
                Monitored Transformers: {grid.monitored_transformers_count || 3} · Ambient Heat: {grid.ambient_heat_index?.toFixed(1) || '34.2'}°C · Wind: {grid.max_wind_gust_kmh?.toFixed(0) || '22'} km/h
              </p>
            </div>
          </div>
          <button className="m3-btn tonal" onClick={() => nav('/predictor')}>
            Outage Predictor &amp; Simulator <ArrowRight size={15} />
          </button>
        </div>
      )}

      <div className="grid grid-4">
        <div className="m3-card primary-tint">
          <div className="m3-label" style={{ color: 'inherit' }}>Live draw</div>
          <div className="kpi">{live.kw} kW</div>
          <div className="kpi-sub">{live.count} of {devices.length} devices on · real-time</div>
        </div>
        <div className="m3-card filled">
          <div className="m3-label">Today</div>
          <div className="kpi">{daily.averageDailyUseKwh} kWh</div>
          <div className="kpi-sub"><span className="up">+{daily.dailyChangePct}%</span> vs yesterday avg</div>
        </div>
        <div className="m3-card filled">
          <div className="m3-label">Estimated bill</div>
          <div className="kpi">${billing.current?.amount?.toFixed(2) || '123.50'}</div>
          <div className="kpi-sub">{billing.current?.due || 'Due Oct 15'} · <Link to="/bills" className="link">Breakdown</Link></div>
        </div>
        <div className="m3-card filled">
          <div className="m3-label">Budget · Monthly</div>
          <div className="kpi">${budget.currentSpent?.toFixed(0) || '118'} <span style={{ fontSize: '1rem', fontWeight: 400 }}>/ ${budget.monthlyBudget?.toFixed(0) || '150'}</span></div>
          <div className="m3-linear" style={{ marginTop: 10 }}><div style={{ width: `${Math.min(100, budget.percentageUsed || 79)}%` }} /></div>
          <div className="kpi-sub" style={{ marginTop: 8 }}>{budget.percentageUsed}% used</div>
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
              <AreaChart data={weekly}>
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
                <div className="meta"><b>{d.name}</b><span>{d.room} · {((d.watts || 0) / 1000).toFixed(2)} kW</span></div>
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

