import { useEffect, useState } from 'react'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ratingBars } from '../data/mockData'
import { api } from '../services/api'

export default function Insights() {
  const [insights, setInsights] = useState({
    totalKwh: 120,
    peakKwh: 50,
    ratingAverage: 4.5,
    totalReviews: 120,
    plugs: [
      { name: 'Light A', kwh: 25, pct: 20.8 },
      { name: 'Fan', kwh: 30, pct: 25.0 },
      { name: 'A.C.', kwh: 45, pct: 37.5 },
    ],
  })

  useEffect(() => {
    let mounted = true
    api.getBedroomInsights().then(data => mounted && setInsights(data))
    return () => { mounted = false }
  }, [])

  const plugBreakdown = insights.plugs.map(p => ({ name: p.name, kwh: p.kwh }))
  const total = insights.totalKwh
  return (
    <>
      <div className="page-head">
        <div>
          <div className="m3-label label-row"><TrendingUp size={14} /> Insight · Energy Insights</div>
          <h1 className="m3-display">Bedroom energy consumption overview</h1>
        </div>
        <div className="chip-row">
          <span className="m3-chip selected">Last 7 Days</span>
          <span className="m3-chip">Last 30 Days</span>
          <span className="m3-chip">By room</span>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="m3-card outlined">
          <div className="m3-label">Energy consumption by plug</div>
          <div className="kpi">Total: {total} kWh</div>
          <div className="kpi-sub">Last 7 Days <span className="good">+15%</span></div>
          <div className="chart-box" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plugBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--md-sys-color-on-surface)', fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: 'var(--md-sys-color-surface-container-highest)', border: 'none', borderRadius: 12 }} />
                <Bar dataKey="kwh" radius={[10, 10, 6, 6]}>
                  {plugBreakdown.map((_, i) => <Cell key={i} fill={i === 2 ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-highest)'} stroke="var(--md-sys-color-outline-variant)" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="m3-card outlined">
          <div className="m3-label">Comparison of plugs usage</div>
          <div className="kpi">Peak: {insights.peakKwh} kWh</div>
          <div className="kpi-sub">Last 7 Days <span className="up">−10%</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>
            {insights.plugs.map(p => (
              <div key={p.name} className="meter-row">
                <b>{p.name}</b>
                <div className="m3-linear"><div style={{ width: `${(p.kwh / (insights.peakKwh || 50)) * 100}%` }} /></div>
                <span className="m3-body">{p.kwh} kWh</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="m3-card filled">
          <div className="rating-wrap">
            <div><div className="rating-score">{insights.ratingAverage}</div><div className="m3-body">{insights.totalReviews} reviews</div></div>
            <div className="rating-bars">
              {ratingBars.map(r => (
                <div key={r.stars} className="rating-row">
                  <span>{r.stars}</span>
                  <div className="m3-linear"><div style={{ width: `${r.pct}%` }} /></div>
                  <span className="m3-body">{r.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="m3-card">
          <div className="m3-list">
            {insights.plugs.map(p => (
              <div className="m3-list-item" key={p.name}>
                <div className="meta"><b>{p.name}</b></div>
                <span>{p.kwh} kWh ({p.pct}%)</span>
              </div>
            ))}
          </div>
          <button className="m3-btn text">View Detailed Insights <ArrowRight size={15} /></button>
        </div>
      </div>
    </>
  )
}
