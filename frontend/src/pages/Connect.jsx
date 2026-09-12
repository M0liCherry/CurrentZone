import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, PlugZap } from 'lucide-react'
import { Snackbar, Dialog } from '../components/ui'
import { recommendations } from '../data/mockData'

export default function Connect() {
  const nav = useNavigate()
  const [done, setDone] = useState(false)
  const [snack, setSnack] = useState('')
  return (
    <>
      <div className="hero-band" style={{ marginTop: 8 }}>
        <div>
          <div className="m3-label label-row" style={{ color: 'inherit' }}><PlugZap size={14} /> Connect Smart Plug</div>
          <h1>Connect your smart plug</h1>
          <p>Follow the steps to connect your smart plug and start monitoring energy usage.</p>
          <div className="head-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="m3-btn filled invert" onClick={() => setDone(true)}>Connect Device</button>
            <button className="m3-btn outlined on-tint" onClick={() => nav('/')}><ArrowLeft size={16} /> Back to dashboard</button>
          </div>
        </div>
        <div className="promo-img"><PlugZap size={56} /></div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        {recommendations.slice(0, 6).map((s, i) => (
          <div className="m3-card filled step-card" key={s.title}>
            <div className="leading"><s.icon size={22} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="m3-body">Step {i + 1}</div>
              <h4 className="m3-title">{s.title}</h4>
              <p className="m3-body">{s.desc}</p>
            </div>
            <span className="trailing"><ChevronRight size={20} /></span>
          </div>
        ))}
      </div>

      {done && (
        <Dialog title="Plug connected"
          onClose={() => setDone(false)}
          actions={<><button className="m3-btn text" onClick={() => setDone(false)}>Close</button><button className="m3-btn filled" onClick={() => { setDone(false); nav('/devices') }}>View devices</button></>}>
          <p>Your SmartWatt plug is online. Live monitoring has started — check the dashboard for real-time draw.</p>
        </Dialog>
      )}
      <Snackbar message={snack} />
    </>
  )
}
