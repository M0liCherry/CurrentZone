import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, CircleHelp, Palette, ShieldAlert, SlidersHorizontal } from 'lucide-react'
import { Switch, Snackbar } from '../components/ui'
import { AppUI } from '../App'
import { api } from '../services/api'

function Row({ label, value, action }) {
  return (
    <div className="m3-list-item">
      <div className="meta"><span className="row-label">{label}</span></div>
      {action ? <button className="icon-btn" aria-label={label} onClick={action}><ChevronRight size={20} /></button> : <span style={{ fontSize: '.9rem' }}>{value}</span>}
    </div>
  )
}

export default function Settings() {
  const nav = useNavigate()
  const { openTheme } = useContext(AppUI)
  const [profile, setProfile] = useState({
    name: 'Leslie Raymond',
    username: 'leslie294',
    birthday: 'July 17, 1989',
    mobile: '(405) 439 - 3985',
    email: 'leslie@gmail.com',
  })
  const [prefs, setPrefs] = useState({ location: true, push: true, green: false })
  const [snack, setSnack] = useState('')


  useEffect(() => {
    let mounted = true
    api.getUserProfile().then(u => mounted && setProfile(p => ({ ...p, ...u })))
    return () => { mounted = false }
  }, [])
  const say = m => { setSnack(m); setTimeout(() => setSnack(''), 2000) }
  return (
    <>
      <div className="page-head">
        <div>
          <div className="m3-label label-row"><SlidersHorizontal size={14} /> Settings &amp; Preferences</div>
          <h1 className="m3-display">Settings</h1>
        </div>
      </div>
      <div className="grid grid-2">
        <div className="m3-card">
          <h3 className="m3-headline">My account</h3>
          <Row label="Name" value={profile.name} />
          <Row label="Username" value={profile.username} />
          <Row label="Birthday" value={profile.birthday} />
          <Row label="Mobile Number" value={profile.mobile} />
          <Row label="Email" value={profile.email} />
          <Row label="Password" action={() => say('Password reset link sent')} />
          <Row label="Notifications" action={() => nav('/notifications')} />
        </div>
        <div>
          <div className="m3-card filled">
            <div className="card-top">
              <h3 className="m3-headline">Appearance</h3>
              <button className="m3-btn tonal" onClick={openTheme}><Palette size={16} /> Theme studio</button>
            </div>
            <p className="m3-body">Dynamic Material You color — change the seed and the whole app re-themes.</p>
          </div>
          <div className="m3-card filled" style={{ marginTop: 20 }}>
            <h3 className="m3-headline">Privacy controls</h3>
            <div className="m3-list-item"><div className="meta"><b>See my location</b><span>My friends</span></div><Switch checked={prefs.location} onChange={v => { setPrefs({ ...prefs, location: v }); say('Location sharing updated') }} label="location" /></div>
            <div className="m3-list-item"><div className="meta"><b>Push notifications</b><span>Budget + device alerts</span></div><Switch checked={prefs.push} onChange={v => { setPrefs({ ...prefs, push: v }); say('Notification prefs saved') }} label="push" /></div>
            <div className="m3-list-item"><div className="meta"><b>Green energy program</b><span>Opt in for promos</span></div><Switch checked={prefs.green} onChange={v => { setPrefs({ ...prefs, green: v }); say('Green program preference saved') }} label="green" /></div>
          </div>
          <div className="m3-card outlined" style={{ marginTop: 20 }}>
            <h3 className="m3-headline">Support</h3>
            <div className="m3-list-item"><div className="leading"><CircleHelp size={20} /></div><div className="meta"><b>I need help</b></div><button className="icon-btn" aria-label="Get help" onClick={() => say('Support chat opening soon')}><ChevronRight size={20} /></button></div>
            <div className="m3-list-item"><div className="leading"><ShieldAlert size={20} /></div><div className="meta"><b>I have a safety concern</b></div><button className="icon-btn" aria-label="Report safety concern" onClick={() => say('Safety team notified')}><ChevronRight size={20} /></button></div>
          </div>
        </div>
      </div>
      <Snackbar message={snack} />
    </>
  )
}
