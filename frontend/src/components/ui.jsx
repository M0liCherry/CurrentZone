import { useEffect } from 'react'

export function Switch({ checked, onChange, label }) {
  return (
    <label className="m3-switch" aria-label={label}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="track" /><span className="thumb" />
    </label>
  )
}

export function Dialog({ title, children, onClose, actions }) {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])
  return (
    <div className="m3-scrim" onClick={onClose}>
      <div className="m3-dialog" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2>{title}</h2>
        <div>{children}</div>
        {actions && <div className="dialog-actions">{actions}</div>}
      </div>
    </div>
  )
}

export function Snackbar({ message, actionLabel, onAction }) {
  if (!message) return null
  return (
    <div className="m3-snackbar">
      <span>{message}</span>
      {actionLabel && <button className="m3-btn text" style={{ padding: '6px 10px' }} onClick={onAction}>{actionLabel}</button>}
    </div>
  )
}

export function Empty({ icon, title, desc }) {
  return (
    <div className="m3-card outlined" style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: '2.4rem' }}>{icon}</div>
      <h3 className="m3-headline" style={{ margin: '12px 0 6px' }}>{title}</h3>
      <p className="m3-body">{desc}</p>
    </div>
  )
}
