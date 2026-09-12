import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { notifications as seed } from '../data/mockData'

export default function Notifications() {
  const [items, setItems] = useState(seed)
  const [filter, setFilter] = useState('all')
  const shown = items.filter(n => (filter === 'unread' ? n.unread : true))
  return (
    <>
      <div className="page-head">
        <div>
          <div className="m3-label label-row"><Bell size={14} /> Alerts &amp; Notifications</div>
          <h1 className="m3-display">Notifications</h1>
          <p className="m3-body">Web notification center — the phone lock-screen alerts, adapted for desktop.</p>
        </div>
        <div className="head-actions">
          <div className="m3-segmented">
            <button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>All</button>
            <button className={filter === 'unread' ? 'selected' : ''} onClick={() => setFilter('unread')}>Unread</button>
          </div>
          <button className="m3-btn text" onClick={() => setItems(items.map(i => ({ ...i, unread: false })))}>Mark all read</button>
        </div>
      </div>
      <div className="grid grid-2">
        {shown.map(n => (
          <div className="m3-card filled notif-card" key={n.id}>
            <div className="leading"><n.icon size={22} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="notif-title"><b>{n.title}</b>{n.unread && <span className="notif-dot" />}</div>
              <p className="m3-body">{n.desc}</p>
              <div className="m3-body" style={{ fontSize: '.78rem', marginTop: 6 }}>{n.time}</div>
            </div>
            {n.unread && (
              <button className="m3-btn text" aria-label={`Mark ${n.title} read`}
                onClick={() => setItems(items.map(i => (i.id === n.id ? { ...i, unread: false } : i)))}>
                <Check size={16} /> Done
              </button>
            )}
          </div>
        ))}
      </div>
      {shown.length === 0 && <p className="m3-body" style={{ marginTop: 20 }}>You are all caught up.</p>}
    </>
  )
}
