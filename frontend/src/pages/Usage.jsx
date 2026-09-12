import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../services/api'

export default function Usage() {
  const [range, setRange] = useState('week')
  const [dailyData, setDailyData] = useState({
    averageDailyUseKwh: 0,
    dailyChangePct: 0,
    comparedToYesterdayKwh: 0,
    peakWindow: '--',
    chart: [],
  })
  const [weeklyData, setWeeklyData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])

  useEffect(() => {
    let mounted = true
    api.getDailyUsage().then(d => mounted && setDailyData(d))
    api.getWeeklyUsage().then(w => mounted && setWeeklyData(w.chart || []))
    api.getMonthlyUsage().then(m => mounted && setMonthlyData(m.chart || []))
    return () => { mounted = false }
  }, [])

  return (
    <>
      <div className="page-head">
        <div>
          <div className="m3-label label-row"><Activity size={14} /> Usage Monitoring · Usage Details</div>
          <h1 className="m3-display">Usage details</h1>
          <p className="m3-body">Real-time daily, weekly, and monthly consumption from ESP32 &amp; plug telemetry.</p>
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
            {dailyData.chart.length > 0 && dailyData.chart.some(c => c.kwh > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData.chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: 'var(--md-sys-color-surface-container-highest)', border: 'none', borderRadius: 12 }} />
                  <Bar dataKey="kwh" radius={[8, 8, 4, 4]} fill="var(--md-sys-color-tertiary-container)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--md-sys-color-outline)' }}>
                <p className="m3-body">No daily telemetry received yet from ESP32 or sensors.</p>
              </div>
            )}
          </div>
          <div className="chip-row" style={{ marginTop: 12 }}>
            {dailyData.chart.map(d => <span key={d.t} className="m3-chip">{d.t} · {d.kwh} kWh</span>)}
          </div>
        </div>
        <div className="grid grid-2">
          <div className="m3-card primary-tint">
            <div className="m3-label" style={{ color: 'inherit' }}>Average daily use</div>
            <div className="kpi">{dailyData.averageDailyUseKwh} kWh</div>
            <div className="good">+{dailyData.dailyChangePct}%</div>
          </div>
          <div className="m3-card filled">
            <div className="m3-label">Compared to yesterday</div>
            <div className="kpi">+{dailyData.comparedToYesterdayKwh} kWh</div>
            <div className="m3-body">Peak window: {dailyData.peakWindow}</div>
          </div>
          <div className="m3-card outlined" style={{ gridColumn: '1 / -1' }}>
            <h4 className="m3-title">Weekly consumption · This week</h4>
            <div className="chart-box" style={{ height: 200 }}>
              {weeklyData.length > 0 && weeklyData.some(w => w.kwh > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="d" tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--md-sys-color-surface-container-highest)', border: 'none', borderRadius: 12 }} />
                    <Bar dataKey="kwh" radius={[8, 8, 4, 4]} fill="var(--md-sys-color-secondary-container)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--md-sys-color-outline)' }}>
                  <p className="m3-body">Awaiting sensor data for this week.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="m3-card" style={{ marginTop: 20 }}>
        <div className="card-top">
          <div><h3 className="m3-headline">Monthly consumption</h3><p className="m3-body">Recorded telemetry history</p></div>
        </div>
        <div className="chart-box tall">
          {monthlyData.length > 0 && monthlyData.some(m => m.kwh > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" />
                <XAxis dataKey="m" tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--md-sys-color-surface-container-highest)', border: 'none', borderRadius: 12 }} />
                <Area type="monotone" dataKey="kwh" stroke="var(--md-sys-color-tertiary)" fill="var(--md-sys-color-tertiary-container)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--md-sys-color-outline)' }}>
              <p className="m3-body">No monthly energy history recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
