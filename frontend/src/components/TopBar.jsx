import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Palette, Search, Settings, Wifi, WifiOff } from 'lucide-react'
import { api } from '../services/api'

export default function TopBar({ onOpenTheme }) {
  const nav = useNavigate()
  const [unread, setUnread] = useState(0)
  const [backendOnline, setBackendOnline] = useState(null)

  const verifyHealth = async () => {
    const res = await api.checkHealth()
    setBackendOnline(res.online)
  }

  useEffect(() => {
    verifyHealth()
    api.getNotifications().then(list => {
      setUnread(list.filter(n => n.unread).length)
    })
    const timer = setInterval(verifyHealth, 15000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="m3-topbar">
      <div className="search">
        <Search size={18} />
        <input placeholder="Search devices, bills, insights…" aria-label="Search" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {backendOnline !== null && (
          <button
            className="m3-chip"
            onClick={verifyHealth}
            title={backendOnline ? 'Connected to FastAPI Backend (port 8000)' : 'Backend offline — Using local mock data'}
            style={{
              cursor: 'pointer',
              fontSize: '.76rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: backendOnline
                ? 'var(--md-sys-color-secondary-container)'
                : 'var(--md-sys-color-surface-container-highest)',
              color: backendOnline
                ? 'var(--md-sys-color-on-secondary-container)'
                : 'var(--md-sys-color-on-surface-variant)',
              border: 'none',
              padding: '4px 10px',
              borderRadius: 999,
            }}
          >
            {backendOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{backendOnline ? 'Backend Online' : 'Mock Mode'}</span>
          </button>
        )}
      </div>

      <div style={{ flex: 1 }} />
      <button className="icon-btn" title="Theme studio" onClick={onOpenTheme}>
        <Palette size={20} />
      </button>
      <button className="icon-btn has-badge" title="Notifications" onClick={() => nav('/notifications')}>
        <Bell size={20} />
        {unread > 0 && <span className="badge">{unread}</span>}
      </button>
      <button className="icon-btn" title="Settings" onClick={() => nav('/settings')}>
        <Settings size={20} />
      </button>
    </header>
  )
}

