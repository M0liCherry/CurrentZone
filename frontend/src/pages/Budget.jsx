import { useEffect, useState } from 'react'
import { Bell, Mail, MessageSquareText, Scale, ShieldCheck } from 'lucide-react'
import { Snackbar } from '../components/ui'
import { api } from '../services/api'

export default function Budget() {
  const [budgetInput, setBudgetInput] = useState('')
  const [budgetStatus, setBudgetStatus] = useState({
    monthlyBudget: 150,
    currentSpent: 0,
    remaining: 150,
    percentageUsed: 0,
    status: 'ON_TRACK',
  })
  const [snack, setSnack] = useState('')

  useEffect(() => {
    let mounted = true
    const load = () => {
      api.getBudget().then(data => {
        if (mounted) {
          setBudgetStatus(data)
          setBudgetInput(prev => prev === '' ? String(data.monthlyBudget) : prev)
        }
      })
    }
    load()
    const interval = setInterval(load, 3000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
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
          <h1 className="m3-display">Manage your energy budget</h1>
          <p className="m3-body">Set monthly energy budgets and get notified when approaching limits based on real sensor draw.</p>
        </div>
      </div>
      <div className="grid grid-2">
        <div className="m3-card">
          <h3 className="m3-headline">Enter budget</h3>
          <p className="m3-body">You can update this target anytime.</p>
          <div className="m3-field" style={{ marginTop: 16 }}>
            <label htmlFor="budget">Monthly budget (USD)</label>
            <input
              id="budget"
              placeholder="e.g., $150"
              value={budgetInput}
              onChange={e => setBudgetInput(e.target.value)}
              inputMode="decimal"
            />
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
              <span className={`status-pill ${budgetStatus.percentageUsed > 80 ? 'due' : 'paid'}`}>
                {budgetStatus.percentageUsed}% used
              </span>
            </div>
            <div className="kpi">
              ${budgetStatus.currentSpent?.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 400 }}>/ ${budgetStatus.monthlyBudget?.toFixed(0)}</span>
            </div>
            <div className="m3-linear" style={{ margin: '14px 0 8px' }}>
              <div style={{ width: `${Math.min(100, budgetStatus.percentageUsed)}%` }} />
            </div>
            <p className="m3-body">
              Remaining: ${budgetStatus.remaining?.toFixed(2)}. Alert triggers automatically when reaching threshold.
            </p>
            <div className="chip-row" style={{ marginTop: 12 }}>
              <span className="m3-chip selected"><Bell size={14} /> Push alerts</span>
              <span className="m3-chip selected"><Mail size={14} /> Email alerts</span>
              <span className="m3-chip"><MessageSquareText size={14} /> SMS</span>
            </div>
          </div>

          <div className="m3-card outlined" style={{ marginTop: 20 }}>
            <h4 className="m3-title">Budget Status</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
              <ShieldCheck size={24} style={{ color: 'var(--md-sys-color-primary)' }} />
              <div>
                <b>{budgetStatus.status === 'ON_TRACK' ? 'Budget On Track' : 'Approaching Budget Limit'}</b>
                <p className="m3-body" style={{ margin: 0, fontSize: '.84rem' }}>
                  Spending is computed in real time from incoming sensor energy totals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Snackbar message={snack} />
    </>
  )
}
