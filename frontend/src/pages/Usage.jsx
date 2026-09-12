import { useState } from 'react'
import { Activity } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dailyUsage, weeklyUsage, monthlyUsage } from '../data/mockData'

export default function Usage() {
  const [range, setRange] = useState('week')
  return (
    <>
      <div className="page-head">
        <div>
          <div className="m3-label label-row"><Activity size={14} /> Usage Monitoring · Usage Details</div>
          <h1 className="m3-display">Usage details</h1>
          <p className="m3-body">Daily, weekly and monthly consumption across all plugs.</p>
        </div>
        <div className="m3-segmented" role="tablist" aria-label="Time range">
          {[['day', 'Day'], ['week', 'Week'], ['month', '12 Months']].map(([v, l]) => (
            <button key={v} className={range === v ? 'selected' : ''} onClick={() => setRange(v)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="m3-card filled">
          <div className="m3-label">Daily consumption · Today</div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: 'var(--md-sys-color-surface-container-highest)', border: 'none', borderRadius: 12 }} />
                <Bar dataKey="kwh" radius={[8, 8, 4, 4]} fill="var(--md-sys-color-tertiary-container)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chip-row" style={{ marginTop: 12 }}>
            {dailyUsage.map(d => <span key={d.t} className="m3-chip">{d.t} · {d.kwh}</span>)}
          </div>
        </div>
        <div className="grid grid-2">
          <div className="m3-card primary-tint">
            <div className="m3-label" style={{ color: 'inherit' }}>Average daily use</div>
            <div className="kpi">28 kWh</div>
            <div className="good">+20%</div>
          </div>
          <div className="m3-card filled">
            <div className="m3-label">Compared to yesterday</div>
            <div className="kpi">+5 kWh</div>
            <div className="m3-body">Peak was 4PM – 8PM</div>
          </div>
          <div className="m3-card outlined" style={{ gridColumn: '1 / -1' }}>
            <h4 className="m3-title">Weekly consumption · This week</h4>
            <div className="chart-box" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyUsage}>
                  <XAxis dataKey="d" tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--md-sys-color-surface-container-highest)', border: 'none', borderRadius: 12 }} />
                  <Bar dataKey="kwh" radius={[8, 8, 4, 4]} fill="var(--md-sys-color-secondary-container)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="m3-card" style={{ marginTop: 20 }}>
        <div className="card-top">
          <div><h3 className="m3-headline">Monthly consumption</h3><p className="m3-body">Last 12 months</p></div>
        </div>
        <div className="chart-box tall">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" />
              <XAxis dataKey="m" tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--md-sys-color-surface-container-highest)', border: 'none', borderRadius: 12 }} />
              <Area type="monotone" dataKey="kwh" stroke="var(--md-sys-color-tertiary)" fill="var(--md-sys-color-tertiary-container)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}
