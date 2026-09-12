import { NavLink } from 'react-router-dom'
import {
  Activity, Bell, House, Lightbulb, LogOut,
  Plug, Plus, Receipt, Scale, Settings, ShieldAlert, TrendingUp, Zap,
} from 'lucide-react'
import { notifications, user } from '../data/mockData'

const links = [
  { section: 'Monitor' },
  { to: '/', label: 'Dashboard', icon: House, end: true },
  { to: '/predictor', label: 'Outage Predictor', icon: ShieldAlert },
  { to: '/usage', label: 'Usage', icon: Activity },
  { to: '/devices', label: 'Devices', icon: Plug },
  { to: '/insights', label: 'Insights', icon: TrendingUp },
  { section: 'Manage' },
  { to: '/bills', label: 'Bills', icon: Receipt },
  { to: '/budget', label: 'Budget & Alerts', icon: Scale },
  { to: '/recommendations', label: 'Save Energy', icon: Lightbulb },
  { to: '/notifications', label: 'Notifications', icon: Bell, badge: notifications.filter(n => n.unread).length },
  { section: 'System' },
  { to: '/connect', label: 'Connect Device', icon: Plus },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function Items({ onNav }) {
  return (
    <>
      {links.map((l, i) =>
        l.section ? (
          <div className="m3-nav-section" key={i}>{l.section}</div>
        ) : (
          <NavLink key={l.to} to={l.to} end={l.end} onClick={onNav}
            className={({ isActive }) => 'm3-nav-item' + (isActive ? ' active' : '')}>
            <span className="ico"><l.icon size={20} /></span>{l.label}
            {l.badge ? <span className="m3-nav-badge">{l.badge}</span> : null}
          </NavLink>
        )
      )}
    </>
  )
}

export function Drawer({ onLogout }) {
  return (
    <aside className="m3-drawer">
      <div className="brand">
        <div className="brand-mark"><Zap size={22} /></div>
        <div><b>CurrentZone</b><span>SmartWatt Energy</span></div>
      </div>
      <Items />
      <div className="drawer-foot">
        <div className="divider" />
        <div className="user-chip">
          <div className="avatar">{user.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="m3-title-sm">{user.name}</div>
            <div className="m3-body" style={{ fontSize: '.78rem' }}>@{user.username}</div>
          </div>
        </div>
        <button className="m3-btn tonal" style={{ width: '100%', marginTop: 12 }} onClick={onLogout}>
          <LogOut size={17} /> Logout / Exit
        </button>
      </div>
    </aside>
  )
}

export function Rail({ onLogout }) {
  const slim = links.filter(l => !l.section).slice(0, 8)
  return (
    <nav className="m3-rail" aria-label="Primary">
      <div className="brand-mark" style={{ width: 48, marginBottom: 8 }}><Zap size={22} /></div>
      {slim.map(l => (
        <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => 'rail-btn' + (isActive ? ' active' : '')}>
          <span className="pill"><l.icon size={20} /></span>{l.label.split(' ')[0]}
        </NavLink>
      ))}
      <button className="rail-btn" onClick={onLogout} style={{ marginTop: 'auto' }}>
        <span className="pill"><LogOut size={20} /></span>Logout
      </button>
    </nav>
  )
}

export function BottomBar() {
  const tabs = [
    { to: '/', label: 'Home', icon: House, end: true },
    { to: '/usage', label: 'Usage', icon: Activity },
    { to: '/devices', label: 'Devices', icon: Plug },
    { to: '/insights', label: 'Insights', icon: TrendingUp },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]
  return (
    <nav className="m3-bottombar" aria-label="Primary">
      {tabs.map(t => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="pill"><t.icon size={22} /></span>{t.label}
        </NavLink>
      ))}
    </nav>
  )
}
