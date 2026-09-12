import { ArrowRight, TrendingUp } from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { plugBreakdown, plugComparison, ratingBars } from '../data/mockData'

export default function Insights() {
  const total = 120
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
          <div className="kpi">Peak: 50 kWh</div>
          <div className="kpi-sub">Last 7 Days <span className="up">−10%</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>
            {plugComparison.map(p => (
              <div key={p.name} className="meter-row">
                <b>{p.name}</b>
                <div className="m3-linear"><div style={{ width: `${(p.kwh / 50) * 100}%` }} /></div>
                <span className="m3-body">{p.kwh}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="m3-card filled">
          <div className="rating-wrap">
            <div><div className="rating-score">4.5</div><div className="m3-body">120 reviews</div></div>
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
            <div className="m3-list-item"><div className="meta"><b>A.C.</b></div><span>45 kWh (37.5%)</span></div>
            <div className="m3-list-item"><div className="meta"><b>Fan</b></div><span>30 kWh (25%)</span></div>
            <div className="m3-list-item"><div className="meta"><b>Light</b></div><span>25 kWh (20.8%)</span></div>
          </div>
          <button className="m3-btn text">View Detailed Insights <ArrowRight size={15} /></button>
        </div>
      </div>
    </>
  )
}
