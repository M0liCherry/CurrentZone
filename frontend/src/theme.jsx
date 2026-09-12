import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { schemeVars } from './color'

const ThemeCtx = createContext(null)
export const useTheme = () => useContext(ThemeCtx)

const DEFAULT_SEED = '#2F7D33'

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('cz-mode') || 'dark')
  const [seed, setSeed] = useState(() => localStorage.getItem('cz-seed') || DEFAULT_SEED)

  const vars = useMemo(() => schemeVars(seed, mode), [seed, mode])

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', mode)
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
    localStorage.setItem('cz-mode', mode)
    localStorage.setItem('cz-seed', seed)
  }, [vars, mode, seed])

  return (
    <ThemeCtx.Provider value={{ mode, setMode, seed, setSeed, toggle: () => setMode(m => (m === 'dark' ? 'light' : 'dark')) }}>
      {children}
    </ThemeCtx.Provider>
  )
}
