import { useEffect, useState } from 'react'
import { ArrowRight, TrendingUp, Zap } from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { api } from '../services/api'

export default function Insights() {
  const [insights, setInsights] = useState({
    totalKwh: 0,
    peakKwh: 0,
    ratingAverage: 5.0,
    totalReviews: 0,
    plugs: [],
  })

  useEffect(() => {
    let mounted = true
    const load = () => {
      api.getBedroomInsights().then(data => mounted && setInsights(data))
    }
    load()
    const interval = setInterval(load, 3000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const plugBreakdown = insights.plugs.map(p => ({ name: p.name, kwh: p.kwh }))
  const total = insights.totalKwh

  return (
    <>
      <div className="page-head">
        <div>
          <div className="m3-label label-row"><TrendingUp size={14} /> Insight · Energy Insights</div>
          <h1 className="m3-display">Appliance energy consumption overview</h1>
          <p className="m3-body">Per-device energy allocation measured from real sensor telemetry.</p>
        </div>
        <div className="chip-row">
          <span className="m3-chip selected">Live Telemetry</span>
          <span className="m3-chip">Today</span>
          <span className="m3-chip">By Device</span>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="m3-card outlined">
          <div className="m3-label">Energy consumption by plug / sensor</div>
          <div className="kpi">Total: {total} kWh</div>
          <div className="kpi-sub">Active Sensor Load</div>
          <div className="chart-box" style={{ height: 220 }}>
            {plugBreakdown.length > 0 && plugBreakdown.some(p => p.kwh > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={plugBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--md-sys-color-on-surface)', fontSize: 13 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: 'var(--md-sys-color-surface-container-highest)', border: 'none', borderRadius: 12 }} />
                  <Bar dataKey="kwh" radius={[10, 10, 6, 6]}>
                    {plugBreakdown.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i === 0 ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-highest)'}
                        stroke="var(--md-sys-color-outline-variant)"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--md-sys-color-outline)' }}>
                <p className="m3-body">Awaiting sensor data to compute device breakdown.</p>
              </div>
            )}
          </div>
        </div>

        <div className="m3-card outlined">
          <div className="m3-label">Comparison of device usage</div>
          <div className="kpi">Peak: {insights.peakKwh} kWh</div>
          <div className="kpi-sub">Highest individual consumer</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>
            {insights.plugs.length > 0 ? (
              insights.plugs.map(p => (
                <div key={p.name} className="meter-row">
                  <b>{p.name}</b>
                  <div className="m3-linear">
                    <div style={{ width: `${(p.kwh / (insights.peakKwh || 1)) * 100}%` }} />
                  </div>
                  <span className="m3-body">{p.kwh} kWh ({p.pct}%)</span>
                </div>
              ))
            ) : (
              <p className="m3-body" style={{ opacity: 0.8, padding: '16px 0' }}>
                No active devices reporting. Devices transmitting on <code>/api/telemetry/ingest</code> will appear here automatically.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="m3-card filled">
          <h3 className="m3-headline" style={{ marginBottom: 6 }}>Device health score</h3>
          <p className="m3-body">Calculated based on thermal stress, voltage stability, and overload margin.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
            <div className="kpi" style={{ fontSize: '2.5rem' }}>{insights.ratingAverage?.toFixed(1) || '5.0'}</div>
            <div>
              <b>Optimal Operating Parameters</b>
              <p className="m3-body" style={{ margin: 0 }}>{insights.totalReviews} active device sensor stream(s)</p>
            </div>
          </div>
        </div>

        <div className="m3-card">
          <h3 className="m3-headline" style={{ marginBottom: 10 }}>Active device shares</h3>
          {insights.plugs.length > 0 ? (
            <div className="m3-list">
              {insights.plugs.map(p => (
                <div className="m3-list-item" key={p.name}>
                  <div className="meta"><b>{p.name}</b></div>
                  <span>{p.kwh} kWh ({p.pct}%)</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="m3-body" style={{ opacity: 0.8, padding: '12px 0' }}>
              No consumption recorded yet. Connect an ESP32 or external smart plug to see active shares.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
