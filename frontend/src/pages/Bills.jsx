import { ArrowRight, Download, Leaf, Receipt } from 'lucide-react'
import { bills } from '../data/mockData'

export default function Bills() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="m3-label label-row"><Receipt size={14} /> Billing &amp; Cost Estimation · Bills</div>
          <h1 className="m3-display">Bills</h1>
        </div>
        <button className="m3-btn tonal"><Download size={16} /> Download statements</button>
      </div>
      <div className="grid grid-3">
        <div className="m3-card primary-tint">
          <div className="m3-label" style={{ color: 'inherit' }}>Current bill</div>
          <h3 className="m3-headline">Estimated Bill</h3>
          <div className="kpi">${bills.current.amount.toFixed(2)}</div>
          <div className="kpi-sub">{bills.current.due}</div>
          <button className="m3-btn filled invert" style={{ marginTop: 14 }}>Pay now</button>
        </div>
        <div className="m3-card filled">
          <h3 className="m3-headline">Past bills</h3>
          <div className="table-wrap">
            <table className="m3-table">
              <tbody>
                {bills.past.map(b => (
                  <tr key={b.month}>
                    <td><b>{b.month}</b><br /><span className="m3-body">{b.status} · ${b.amount.toFixed(2)}</span></td>
                    <td style={{ textAlign: 'right' }}><span className="status-pill paid">{b.status}</span><br /><span className="m3-body">{b.due}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="m3-card filled">
            <div className="m3-label">Savings</div>
            <h3 className="m3-headline">Estimated Savings</h3>
            <div className="kpi good">${bills.savings.toFixed(2)}</div>
            <div className="kpi-sub">This Month</div>
          </div>
          <div className="m3-card" style={{ marginTop: 20 }}>
            <div className="m3-label">Promo</div>
            <h3 className="m3-headline">Switch to Green Energy</h3>
            <p className="m3-body">Save more with sustainable energy solutions.</p>
            <div className="promo-row">
              <button className="m3-btn tonal">Learn More <ArrowRight size={15} /></button>
              <div className="promo-img"><Leaf size={44} /></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
