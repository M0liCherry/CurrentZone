import { useNavigate } from 'react-router-dom'
import { Bell, Palette, Search, Settings } from 'lucide-react'
import { notifications } from '../data/mockData'

export default function TopBar({ onOpenTheme }) {
  const nav = useNavigate()
  const unread = notifications.filter(n => n.unread).length
  return (
    <header className="m3-topbar">
      <div className="search"><Search size={18} /><input placeholder="Search devices, bills, insights…" aria-label="Search" /></div>
      <div style={{ flex: 1 }} />
      <button className="icon-btn" title="Theme studio" onClick={onOpenTheme}><Palette size={20} /></button>
      <button className="icon-btn has-badge" title="Notifications" onClick={() => nav('/notifications')}>
        <Bell size={20} />
        {unread > 0 && <span className="badge">{unread}</span>}
      </button>
      <button className="icon-btn" title="Settings" onClick={() => nav('/settings')}><Settings size={20} /></button>
    </header>
  )
}
