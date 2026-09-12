import { useEffect, useMemo, useState } from 'react'
import { Activity, Zap, Cpu } from 'lucide-react'
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
  const [devices, setDevices] = useState([])

  useEffect(() => {
    let mounted = true
    const load = () => {
      api.getDailyUsage().then(d => mounted && setDailyData(d))
      api.getWeeklyUsage().then(w => mounted && setWeeklyData(w.chart || []))
      api.getMonthlyUsage().then(m => mounted && setMonthlyData(m.chart || []))
      api.getDevices().then(ds => mounted && setDevices(ds))
    }
    load()
    const interval = setInterval(load, 3000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const appliances = useMemo(() => {
    const list = devices.filter(d => d.id !== 'esp32_sct013_res_01')
    return list.length > 0 ? list : devices
  }, [devices])

  const totalWatts = useMemo(() => {
    return appliances.reduce((sum, d) => sum + (d.watts || 0), 0)
  }, [appliances])

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
            <div className="kpi">{Number(dailyData.averageDailyUseKwh || 0).toFixed(2)} kWh</div>
            <div className="good">+{dailyData.dailyChangePct}%</div>
          </div>
          <div className="m3-card filled">
            <div className="m3-label">Compared to yesterday</div>
            <div className="kpi">+{Number(dailyData.comparedToYesterdayKwh || 0).toFixed(2)} kWh</div>
            <div className="m3-body">Peak window: <b>{dailyData.peakWindow}</b></div>
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

      {/* Active Appliances & Device Electricity Breakdown */}
      <div className="m3-card outlined" style={{ marginTop: 20 }}>
        <div className="card-top" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="m3-label label-row"><Zap size={14} /> Real-Time Device Telemetry</div>
            <h3 className="m3-headline">Active appliance &amp; device electricity draw</h3>
            <p className="m3-body">
              Live power draw and accumulated energy allocation across household appliances simulated and synchronized from ESP32 feeder telemetry.
            </p>
          </div>
          <div className="chip-row">
            <span className="m3-chip selected" style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
              ● Live Draw
            </span>
            <span className="m3-chip">{appliances.length} Devices Monitored</span>
          </div>
        </div>

        {appliances.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            {appliances.map(app => {
              const share = totalWatts > 0 ? Math.round(((app.watts || 0) / totalWatts) * 100) : 0
              const Icon = app.icon || Zap
              return (
                <div 
                  key={app.id} 
                  style={{
                    padding: '14px 18px',
                    borderRadius: 16,
                    background: 'var(--md-sys-color-surface-container-low)',
                    border: '1px solid var(--md-sys-color-outline-variant)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div 
                        style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 12, 
                          background: 'var(--md-sys-color-primary-container)', 
                          color: 'var(--md-sys-color-primary)',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}
                      >
                        <Icon size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--md-sys-color-on-surface)' }}>
                          {app.name}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                          {app.room} · {app.currentAmps?.toFixed(1) || '0.0'} A · {share}% of live load
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--md-sys-color-primary)' }}>
                        {app.watts >= 1000 ? `${(app.watts / 1000).toFixed(2)} kW` : `${Math.round(app.watts || 0)} W`}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        <b>{Number(app.todayKwh || 0).toFixed(3)} kWh</b> today
                      </div>
                    </div>
                  </div>

                  {/* Visual Power Share Bar */}
                  <div className="m3-linear" style={{ marginTop: 10, height: 6 }}>
                    <div style={{ width: `${Math.min(100, Math.max(3, share))}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--md-sys-color-outline)' }}>
            <p className="m3-body">Connecting to ESP32 device stream...</p>
          </div>
        )}
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
