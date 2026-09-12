import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, Lightbulb, LogOut, RefreshCw, Zap,
  TrendingDown, CheckCircle2, Sparkles, AlertCircle
} from 'lucide-react'
import { recommendations } from '../constants/tips'
import { api } from '../services/api'
import { AppUI } from '../App'

const routes = {
  'Live Usage Monitor': '/usage',
  'Appliance Insights': '/insights',
  'Billing & Cost Estimation': '/bills',
  'Set Budget & Get Alerts': '/budget',
  'Save Energy Recommendations': '/recommendations',
  'Historical Data': '/devices',
  'Settings & Preferences': '/settings',
}

export default function Recommendations() {
  const nav = useNavigate()
  const { requestLogout } = useContext(AppUI)
  const [data, setData] = useState({
    totalSavings: 0,
    summary: 'Derived from live ESP32 telemetry',
    tips: [],
  })
  const [loading, setLoading] = useState(true)

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const res = await api.getRecommendations()
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [])

  return (
    <>
      <div className="page-head">
        <div>
          <div className="m3-label label-row">
            <Lightbulb size={14} /> Telemetry Insights · Energy Optimization
          </div>
          <h1 className="m3-display">Energy Optimization</h1>
          <p className="m3-body">{data.summary}</p>
        </div>
        <div className="head-actions">
          <button
            className="m3-btn tonal"
            onClick={fetchRecommendations}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Analysis
          </button>
          <button className="m3-btn filled" onClick={requestLogout}>
            <LogOut size={16} /> Logout / Exit App
          </button>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Navigation / Features Directory */}
        <div className="m3-card">
          <div className="card-top" style={{ marginBottom: 8 }}>
            <h3 className="m3-headline">System Navigation</h3>
            <span className="m3-chip">Live Suite</span>
          </div>
          <div className="m3-list">
            {recommendations.map(r => (
              <button
                key={r.title}
                className="m3-list-item as-button"
                onClick={() => nav(routes[r.title] || '/')}
              >
                <div className="leading"><r.icon size={22} /></div>
                <div className="meta">
                  <b>{r.title}</b>
                  <span>{r.desc}</span>
                </div>
                <span className="trailing"><ChevronRight size={20} /></span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Telemetry-Derived Energy Tips */}
        <div>
          <div className="card-top" style={{ marginBottom: 12 }}>
            <h3 className="m3-headline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} /> Telemetry Optimization Tips
            </h3>
            {data.totalSavings > 0 && (
              <span className="status-pill paid" style={{ fontWeight: 700 }}>
                Cut ~${data.totalSavings.toFixed(2)}/mo
              </span>
            )}
          </div>

          {loading ? (
            <div className="m3-card filled" style={{ textAlign: 'center', padding: 32 }}>
              <RefreshCw size={32} className="spin" style={{ color: 'var(--md-sys-color-primary)', marginBottom: 8 }} />
              <p className="m3-body">Analyzing telemetry readings &amp; power factor...</p>
            </div>
          ) : data.tips && data.tips.length > 0 ? (
            data.tips.map(t => (
              <div className="m3-card filled" key={t.title} style={{ marginBottom: 16 }}>
                <div className="card-top">
                  <h4 className="m3-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {t.impact >= 90 ? <CheckCircle2 size={16} style={{ color: 'var(--md-sys-color-primary)' }} /> : <Zap size={16} />}
                    {t.title}
                  </h4>
                  <span className="status-pill paid">{t.save}</span>
                </div>
                <p className="m3-body" style={{ margin: '6px 0 12px' }}>{t.desc}</p>
                <div className="m3-linear">
                  <div style={{ width: `${t.impact}%` }} />
                </div>
                <div className="kpi-sub" style={{ marginTop: 6 }}>
                  Optimization Score: {t.impact}/100
                </div>
              </div>
            ))
          ) : (
            <div className="m3-card filled" style={{ textAlign: 'center', padding: 32 }}>
              <AlertCircle size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
              <h4 className="m3-title">No Anomalies Detected</h4>
              <p className="m3-body">Current telemetry readings indicate nominal branch operation.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
