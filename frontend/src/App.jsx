import { createContext, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { LogOut, Plus } from 'lucide-react'
import { Drawer, Rail, BottomBar } from './components/Navigation'
import TopBar from './components/TopBar'
import ThemeDialog from './components/ThemeDialog'
import { Dialog } from './components/ui'
import Dashboard from './pages/Dashboard'
import Predictor from './pages/Predictor'
import Usage from './pages/Usage'
import Devices from './pages/Devices'
import Insights from './pages/Insights'
import Bills from './pages/Bills'
import Budget from './pages/Budget'
import Recommendations from './pages/Recommendations'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Connect from './pages/Connect'

export const AppUI = createContext({ requestLogout: () => {}, openTheme: () => {} })

export default function App() {
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [loggedOut, setLoggedOut] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const nav = useNavigate()
  const requestLogout = () => setConfirmLogout(true)
  const openTheme = () => setThemeOpen(true)
  const doLogout = () => { setConfirmLogout(false); setLoggedOut(true); setTimeout(() => { setLoggedOut(false); nav('/') }, 2600) }

  return (
    <AppUI.Provider value={{ requestLogout, openTheme }}>
      <div className="app-shell">
        <Drawer onLogout={requestLogout} />
        <Rail onLogout={requestLogout} />
        <div className="main-col">
          <TopBar onOpenTheme={openTheme} />
          <main className="page">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/predictor" element={<Predictor />} />
              <Route path="/usage" element={<Usage />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/bills" element={<Bills />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/connect" element={<Connect />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </main>
          <BottomBar />
          <button className="m3-fab" onClick={() => nav('/connect')}><Plus size={18} /> Connect plug</button>
        </div>

        {confirmLogout && (
          <Dialog title="Log out — are you sure?"
            onClose={() => setConfirmLogout(false)}
            actions={<><button className="m3-btn text" onClick={() => setConfirmLogout(false)}>Cancel</button><button className="m3-btn error" onClick={doLogout}><LogOut size={16} /> Log out</button></>}>
            <p>You will need to log back in and re-enable Touch ID to use the app.</p>
          </Dialog>
        )}
        {themeOpen && <ThemeDialog onClose={() => setThemeOpen(false)} />}
        {loggedOut && <div className="m3-snackbar"><span>Logged out. See you soon, Leslie.</span></div>}
      </div>
    </AppUI.Provider>
  )
}
