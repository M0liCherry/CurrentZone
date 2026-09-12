// Minimal Material-3-style dynamic color: seed hex -> tonal schemes.
// Mimics Material Theme Builder: harmonized primary/secondary/tertiary +
// neutral surfaces, with M3 spec tones for light & dark schemes.

export const SEEDS = [
  { name: 'Baseline', hex: '#6750A4' },
  { name: 'Energy', hex: '#2F7D33' },
  { name: 'Teal', hex: '#00796B' },
  { name: 'Ocean', hex: '#0061A4' },
  { name: 'Sunset', hex: '#B3261E' },
  { name: 'Amber', hex: '#8A5100' },
  { name: 'Orchid', hex: '#8E4A8B' },
  { name: 'Slate', hex: '#475569' },
]

export function hexToHsl(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const n = v => parseInt(v, 16) / 255
  const r = n(h.slice(0, 2)), g = n(h.slice(2, 4)), b = n(h.slice(4, 6))
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }
  const d = max - min
  const s = d / (1 - Math.abs(2 * l - 1))
  let hh = 0
  if (max === r) hh = ((g - b) / d) % 6
  else if (max === g) hh = (b - r) / d + 2
  else hh = (r - g) / d + 4
  hh = Math.round(hh * 60)
  if (hh < 0) hh += 360
  return { h: hh, s: s * 100, l: l * 100 }
}

export function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360
  s = Math.min(100, Math.max(0, s)) / 100
  l = Math.min(100, Math.max(0, l)) / 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const to = v => Math.round(v * 255).toString(16).padStart(2, '0')
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`
}

const T = (h, s, tone) => hslToHex(h, s, tone)

export function schemeVars(seedHex, mode) {
  const { h, s } = hexToHsl(seedHex)
  const sat = Math.max(s, 12)
  const P = { h, s: Math.min(84, Math.max(36, sat)) }
  const S = { h, s: Math.min(40, Math.max(16, sat * 0.45)) }
  const R = { h: h + 60, s: Math.min(60, Math.max(24, sat * 0.7)) }
  const N = { h, s: Math.min(10, sat * 0.14) }
  const NV = { h, s: Math.min(20, sat * 0.28 + 6) }

  if (mode === 'light') {
    return {
      '--md-sys-color-primary': T(P.h, P.s, 40),
      '--md-sys-color-on-primary': '#ffffff',
      '--md-sys-color-primary-container': T(P.h, P.s, 90),
      '--md-sys-color-on-primary-container': T(P.h, P.s, 10),
      '--md-sys-color-secondary': T(S.h, S.s, 40),
      '--md-sys-color-on-secondary': '#ffffff',
      '--md-sys-color-secondary-container': T(S.h, S.s, 90),
      '--md-sys-color-on-secondary-container': T(S.h, S.s, 10),
      '--md-sys-color-tertiary': T(R.h, R.s, 40),
      '--md-sys-color-on-tertiary': '#ffffff',
      '--md-sys-color-tertiary-container': T(R.h, R.s, 90),
      '--md-sys-color-on-tertiary-container': T(R.h, R.s, 10),
      '--md-sys-color-error': '#ba1a1a',
      '--md-sys-color-on-error': '#ffffff',
      '--md-sys-color-error-container': '#ffdad6',
      '--md-sys-color-on-error-container': '#410002',
      '--md-sys-color-background': T(N.h, N.s, 98),
      '--md-sys-color-on-background': T(N.h, N.s, 10),
      '--md-sys-color-surface': T(N.h, N.s, 98),
      '--md-sys-color-on-surface': T(N.h, N.s, 10),
      '--md-sys-color-surface-variant': T(NV.h, NV.s, 90),
      '--md-sys-color-on-surface-variant': T(NV.h, NV.s, 30),
      '--md-sys-color-surface-container-lowest': '#ffffff',
      '--md-sys-color-surface-container-low': T(N.h, N.s, 96),
      '--md-sys-color-surface-container': T(N.h, N.s, 94),
      '--md-sys-color-surface-container-high': T(N.h, N.s, 92),
      '--md-sys-color-surface-container-highest': T(N.h, N.s, 90),
      '--md-sys-color-outline': T(NV.h, NV.s, 50),
      '--md-sys-color-outline-variant': T(NV.h, NV.s, 80),
      '--md-sys-color-inverse-surface': T(N.h, N.s, 20),
      '--md-sys-color-inverse-on-surface': T(N.h, N.s, 95),
      '--md-sys-color-surface-tint': T(P.h, P.s, 40),
    }
  }
  return {
    '--md-sys-color-primary': T(P.h, P.s, 80),
    '--md-sys-color-on-primary': T(P.h, P.s, 20),
    '--md-sys-color-primary-container': T(P.h, P.s, 30),
    '--md-sys-color-on-primary-container': T(P.h, P.s, 90),
    '--md-sys-color-secondary': T(S.h, S.s, 80),
    '--md-sys-color-on-secondary': T(S.h, S.s, 20),
    '--md-sys-color-secondary-container': T(S.h, S.s, 30),
    '--md-sys-color-on-secondary-container': T(S.h, S.s, 90),
    '--md-sys-color-tertiary': T(R.h, R.s, 80),
    '--md-sys-color-on-tertiary': T(R.h, R.s, 20),
    '--md-sys-color-tertiary-container': T(R.h, R.s, 30),
    '--md-sys-color-on-tertiary-container': T(R.h, R.s, 90),
    '--md-sys-color-error': '#ffb4ab',
    '--md-sys-color-on-error': '#690005',
    '--md-sys-color-error-container': '#93000a',
    '--md-sys-color-on-error-container': '#ffdad6',
    '--md-sys-color-background': T(N.h, N.s, 6),
    '--md-sys-color-on-background': T(N.h, N.s, 90),
    '--md-sys-color-surface': T(N.h, N.s, 6),
    '--md-sys-color-on-surface': T(N.h, N.s, 90),
    '--md-sys-color-surface-variant': T(NV.h, NV.s, 30),
    '--md-sys-color-on-surface-variant': T(NV.h, NV.s, 80),
    '--md-sys-color-surface-container-lowest': T(N.h, N.s, 4),
    '--md-sys-color-surface-container-low': T(N.h, N.s, 10),
    '--md-sys-color-surface-container': T(N.h, N.s, 12),
    '--md-sys-color-surface-container-high': T(N.h, N.s, 17),
    '--md-sys-color-surface-container-highest': T(N.h, N.s, 22),
    '--md-sys-color-outline': T(NV.h, NV.s, 60),
    '--md-sys-color-outline-variant': T(NV.h, NV.s, 30),
    '--md-sys-color-inverse-surface': T(N.h, N.s, 90),
    '--md-sys-color-inverse-on-surface': T(N.h, N.s, 20),
    '--md-sys-color-surface-tint': T(P.h, P.s, 80),
  }
}
