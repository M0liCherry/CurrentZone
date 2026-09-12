import { Check, Moon, Sun } from 'lucide-react'
import { SEEDS } from '../color'
import { useTheme } from '../theme'
import { Dialog } from './ui'

function Preview() {
  return (
    <div className="m3-card outlined" style={{ marginTop: 16 }}>
      <div className="m3-label" style={{ marginBottom: 12 }}>Preview</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="m3-btn filled" type="button">Filled</button>
        <button className="m3-btn tonal" type="button">Tonal</button>
        <button className="m3-btn outlined" type="button">Outlined</button>
      </div>
      <div className="chip-row" style={{ marginBottom: 12 }}>
        <span className="m3-chip selected">Chip selected</span>
        <span className="m3-chip">Chip</span>
      </div>
      <div className="m3-linear"><div style={{ width: '62%' }} /></div>
    </div>
  )
}

export default function ThemeDialog({ onClose }) {
  const { mode, setMode, seed, setSeed } = useTheme()
  return (
    <Dialog
      title="Theme studio"
      onClose={onClose}
      actions={<button className="m3-btn filled" onClick={onClose}>Done</button>}
    >
      <p className="m3-body">Material You dynamic color — pick a seed and the whole UI re-themes.</p>

      <div className="m3-label" style={{ margin: '18px 0 10px' }}>Seed color</div>
      <div className="swatch-grid">
        {SEEDS.map(s => {
          const active = s.hex.toLowerCase() === seed.toLowerCase()
          return (
            <button
              key={s.hex}
              type="button"
              title={s.name}
              aria-label={`Seed ${s.name}`}
              className={'swatch' + (active ? ' active' : '')}
              style={{ background: s.hex }}
              onClick={() => setSeed(s.hex)}
            >
              {active && <Check size={18} color="#fff" />}
            </button>
          )
        })}
        <label className="swatch custom" title="Custom seed color">
          <input type="color" value={seed} onChange={e => setSeed(e.target.value)} aria-label="Custom seed color" />
          <span>+</span>
        </label>
      </div>
      <div className="m3-body" style={{ marginTop: 8, fontSize: '.82rem' }}>Seed: <b>{seed}</b></div>

      <div className="m3-label" style={{ margin: '18px 0 10px' }}>Brightness</div>
      <div className="m3-segmented">
        <button type="button" className={mode === 'light' ? 'selected' : ''} onClick={() => setMode('light')}>
          <Sun size={15} style={{ verticalAlign: '-2px' }} /> Light
        </button>
        <button type="button" className={mode === 'dark' ? 'selected' : ''} onClick={() => setMode('dark')}>
          <Moon size={15} style={{ verticalAlign: '-2px' }} /> Dark
        </button>
      </div>

      <Preview />
    </Dialog>
  )
}
