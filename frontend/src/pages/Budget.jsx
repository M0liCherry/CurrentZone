import { useEffect, useState } from 'react'
import { Bell, Mail, MessageSquareText, Scale } from 'lucide-react'
import { Snackbar } from '../components/ui'
import { api } from '../services/api'

export default function Budget() {
  const [budgetInput, setBudgetInput] = useState('')
  const [budgetStatus, setBudgetStatus] = useState({
    monthlyBudget: 150,
    currentSpent: 118,
    remaining: 32,
    percentageUsed: 79,
    status: 'ON_TRACK',
  })
  const [snack, setSnack] = useState('')

  useEffect(() => {
    let mounted = true
    api.getBudget().then(data => {
      if (mounted) {
        setBudgetStatus(data)
        setBudgetInput(String(data.monthlyBudget))
      }
    })
    return () => { mounted = false }
  }, [])

  const submit = async () => {
    const v = Number(budgetInput)
    if (!v || v <= 0) {
      setSnack('Enter a valid budget amount')
      setTimeout(() => setSnack(''), 2000)
      return
    }
    try {
      const res = await api.updateBudget({ monthly_budget_usd: v })
      setBudgetStatus(res)
      setSnack(`Budget updated to $${v.toFixed(2)}`)
    } catch {
      setSnack('Failed to update budget')
    }
    setTimeout(() => setSnack(''), 2200)
  }
  return (
    <>
      <div className="page-head">
        <div>
          <div className="m3-label label-row"><Scale size={14} /> Set Budgets &amp; Get Alerts</div>
          <h1 className="m3-display">Manage your energy usage</h1>
          <p className="m3-body">Set monthly energy budgets and get notified when nearing limits. Monitor usage and save costs.</p>
        </div>
      </div>
      <div className="grid grid-2">
        <div className="m3-card">
          <h3 className="m3-headline">Enter budget</h3>
          <p className="m3-body">You can update this anytime.</p>
          <div className="m3-field" style={{ marginTop: 16 }}>
            <label htmlFor="budget">Monthly budget (USD)</label>
            <input id="budget" placeholder="e.g., $100" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} inputMode="decimal" />
          </div>
          <div className="btn-row">
            <button className="m3-btn filled" style={{ flex: 1 }} onClick={submit}>Set Budget</button>
            <button className="m3-btn tonal" style={{ flex: 1 }} onClick={() => setBudgetInput(String(budgetStatus.monthlyBudget))}>Reset</button>
          </div>
        </div>
        <div>
          <div className="m3-card filled">
            <div className="card-top">
              <h3 className="m3-headline">Monthly budget</h3>
              <span className="status-pill due">{budgetStatus.percentageUsed}% used</span>
            </div>
            <div className="kpi">${budgetStatus.currentSpent?.toFixed(0)} <span style={{ fontSize: '1rem', fontWeight: 400 }}>/ ${budgetStatus.monthlyBudget?.toFixed(0)}</span></div>
            <div className="m3-linear" style={{ margin: '14px 0 8px' }}><div style={{ width: `${Math.min(100, budgetStatus.percentageUsed)}%` }} /></div>
            <p className="m3-body">Remaining: ${budgetStatus.remaining?.toFixed(2)}. Alert triggers at 80% and 100%. Push + email enabled.</p>
            <div className="chip-row" style={{ marginTop: 12 }}>
              <span className="m3-chip selected"><Bell size={14} /> Push alerts</span>
              <span className="m3-chip selected"><Mail size={14} /> Email alerts</span>
              <span className="m3-chip"><MessageSquareText size={14} /> SMS</span>
            </div>
          </div>
          <div className="m3-card outlined" style={{ marginTop: 20 }}>
            <h4 className="m3-title">Alert history</h4>
            <div className="m3-list">
              <div className="m3-list-item"><div className="leading"><Bell size={20} /></div><div className="meta"><b>80% of September budget</b><span>Sep 22 · 9:41 AM</span></div></div>
              <div className="m3-list-item"><div className="leading"><Mail size={20} /></div><div className="meta"><b>August under budget</b><span>Sep 01 · saved $20</span></div></div>
            </div>
          </div>
        </div>
      </div>
      <Snackbar message={snack} />
    </>
  )
}
