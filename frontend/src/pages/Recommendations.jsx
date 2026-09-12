import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Lightbulb, LogOut } from 'lucide-react'
import { recommendations, savingTips } from '../data/mockData'
import { AppUI } from '../App'

const routes = { 'Live Usage Monitor': '/usage', 'Appliance Insights': '/insights', 'Billing & Cost Estimation': '/bills', 'Set Budget & Get Alerts': '/budget', 'Save Energy Recommendations': '/recommendations', 'Historical Data': '/devices', 'Settings & Preferences': '/settings' }

export default function Recommendations() {
  const nav = useNavigate()
  const { requestLogout } = useContext(AppUI)
  return (
    <>
      <div className="page-head">
        <div>
          <div className="m3-label label-row"><Lightbulb size={14} /> Save Energy Recommendations</div>
          <h1 className="m3-display">Save energy</h1>
          <p className="m3-body">Personalized energy-saving tips — cut ~$47/mo.</p>
        </div>
        <button className="m3-btn filled" onClick={requestLogout}><LogOut size={16} /> Logout / Exit App</button>
      </div>
      <div className="grid grid-2">
        <div className="m3-card">
          <div className="m3-list">
            {recommendations.map(r => (
              <button key={r.title} className="m3-list-item as-button" onClick={() => nav(routes[r.title] || '/')}>
                <div className="leading"><r.icon size={22} /></div>
                <div className="meta"><b>{r.title}</b><span>{r.desc}</span></div>
                <span className="trailing"><ChevronRight size={20} /></span>
              </button>
            ))}
          </div>
        </div>
        <div>
          {savingTips.map(t => (
            <div className="m3-card filled" key={t.title} style={{ marginBottom: 16 }}>
              <div className="card-top"><h4 className="m3-title">{t.title}</h4><span className="status-pill paid">{t.save}</span></div>
              <p className="m3-body">{t.desc}</p>
              <div className="m3-linear" style={{ marginTop: 12 }}><div style={{ width: `${t.impact}%` }} /></div>
              <div className="kpi-sub" style={{ marginTop: 6 }}>Impact {t.impact}/100</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
