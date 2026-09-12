import { useEffect, useState, useRef } from 'react'
import {
  Receipt, Upload, FileText, CheckCircle2, AlertCircle,
  Sparkles, RefreshCw, Trash2, Eye, Calendar,
  TrendingDown, Zap, ArrowRight, Leaf, DollarSign, X
} from 'lucide-react'
import { api } from '../services/api'
import { Snackbar, Dialog } from '../components/ui'

export default function Bills() {
  const [bills, setBills] = useState({
    current: {
      amount: 0,
      due: 'Due Next Cycle',
      projectedKwh: 0,
      kwhSoFar: 0,
      ratePerKwh: 0.15,
      fixedCharges: 0,
      taxAmount: 0,
      tariffSource: 'Standard Utility Tariff',
      daysElapsed: 1,
      daysRemaining: 29,
    },
    past: [],
    savings: 0,
  })
  const [loading, setLoading] = useState(true)
  const [snack, setSnack] = useState('')

  // Upload & Extraction state
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [extractedData, setExtractedData] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [activeImageModal, setActiveImageModal] = useState(null)
  const fileInputRef = useRef(null)

  const fetchBillingSummary = async () => {
    setLoading(true)
    try {
      const data = await api.getBillingSummary()
      setBills(data)
    } catch {
      setSnack('Failed to refresh billing data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBillingSummary()
  }, [])

  const handleFile = async (file) => {
    if (!file) return
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
      setSnack('Please upload an image (PNG, JPG, WEBP) or a PDF document.')
      return
    }

    setUploading(true)
    setExtractedData(null)
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }

    try {
      const result = await api.uploadBill(file)
      setExtractedData({
        month_label: result.month_label || 'Aug 2026',
        energy_kwh: result.energy_kwh || 0,
        amount_usd: result.amount_usd || 0,
        rate_per_kwh: result.rate_per_kwh || 0.15,
        fixed_charges: result.fixed_charges || 0,
        tax_amount: result.tax_amount || 0,
        due_date: result.due_date || 'Due Next Cycle',
        account_number: result.account_number || '',
        provider: result.provider || 'Electric Utility',
        image_path: result.image_path || '',
        raw_text_snippet: result.raw_text_snippet || '',
      })
      setSnack('Bill scanned successfully! Please review and confirm the extracted values.')
    } catch (err) {
      setSnack(err.message || 'Failed to parse bill. Please try another image.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleConfirmBill = async (e) => {
    e.preventDefault()
    if (!extractedData) return

    setLoading(true)
    try {
      await api.confirmBill({
        month_label: extractedData.month_label,
        amount_usd: Number(extractedData.amount_usd),
        energy_kwh: Number(extractedData.energy_kwh),
        rate_per_kwh: Number(extractedData.rate_per_kwh),
        fixed_charges: Number(extractedData.fixed_charges),
        tax_amount: Number(extractedData.tax_amount),
        due_date: extractedData.due_date,
        status: 'Paid',
        image_path: extractedData.image_path,
      })
      setSnack(`Bill for ${extractedData.month_label} confirmed! Current month forecast recalculated.`)
      setExtractedData(null)
      setPreviewUrl(null)
      await fetchBillingSummary()
    } catch (err) {
      setSnack('Failed to save bill record')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBill = async (billId, monthLabel) => {
    if (!window.confirm(`Delete billing record for ${monthLabel}?`)) return
    try {
      await api.deleteBill(billId)
      setSnack(`Deleted bill record for ${monthLabel}`)
      await fetchBillingSummary()
    } catch {
      setSnack('Failed to delete bill record')
    }
  }

  const cur = bills.current || {}
  const totalDays = (cur.daysElapsed || 1) + (cur.daysRemaining || 29)
  const monthProgressPct = Math.round(((cur.daysElapsed || 1) / totalDays) * 100)

  return (
    <>
      <div className="page-head">
        <div>
          <div className="m3-label label-row">
            <Receipt size={14} /> Utility Intelligence · Dynamic Cost Prediction
          </div>
          <h1 className="m3-display">Electricity Bills &amp; Forecasting</h1>
          <p className="m3-body">
            Upload any electricity bill picture to extract tariff rates, fixed fees, and predict your current month’s bill from real ESP32 telemetry.
          </p>
        </div>
        <div className="head-actions">
          <button
            className="m3-btn tonal"
            onClick={fetchBillingSummary}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Telemetry
          </button>
          <button
            className="m3-btn filled"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} /> Upload Bill Image
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      </div>

      {/* Top Section: Live AI Current Month Prediction + Upload Dropzone */}
      <div className="grid grid-2" style={{ alignItems: 'stretch' }}>
        {/* Card 1: Live Current Month Projection */}
        <div className="m3-card primary-tint" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="m3-chip" style={{ background: 'rgba(255,255,255,0.2)', color: 'inherit', marginBottom: 8 }}>
                  <Sparkles size={13} style={{ marginRight: 4 }} /> AI Telemetry Forecast
                </span>
                <h3 className="m3-headline" style={{ margin: '4px 0 2px' }}>Current Month Estimated Bill</h3>
                <div className="m3-body" style={{ opacity: 0.85 }}>
                  Based on live ESP32 consumption and extracted utility tariff
                </div>
              </div>
              <span className="status-pill" style={{ background: 'rgba(255,255,255,0.25)', color: 'inherit', fontWeight: 700 }}>
                {cur.due || 'Due Next Cycle'}
              </span>
            </div>

            <div style={{ margin: '24px 0 16px' }}>
              <div className="kpi" style={{ fontSize: '3rem', fontWeight: 800 }}>
                ${cur.amount?.toFixed(2) || '0.00'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.9rem', opacity: 0.9, marginTop: 4 }}>
                <Zap size={15} />
                <span><b>{cur.projectedKwh?.toFixed(1) || '0.0'} kWh</b> projected total this month</span>
                <span>({cur.kwhSoFar?.toFixed(2) || '0.00'} kWh recorded so far)</span>
              </div>
            </div>

            {/* Billing Cycle Progress */}
            <div style={{ background: 'rgba(0,0,0,0.08)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.84rem', marginBottom: 6 }}>
                <span>Month Cycle: Day {cur.daysElapsed} of {totalDays}</span>
                <b>{cur.daysRemaining} days remaining</b>
              </div>
              <div className="m3-linear" style={{ background: 'rgba(255,255,255,0.25)' }}>
                <div style={{ width: `${monthProgressPct}%`, background: 'currentColor' }} />
              </div>
            </div>

            {/* Tariff Breakdown Line Items */}
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', fontSize: '.86rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.85 }}>Energy Charges ({cur.projectedKwh?.toFixed(1)} kWh × ${cur.ratePerKwh?.toFixed(3)}):</span>
                <b>${((cur.projectedKwh || 0) * (cur.ratePerKwh || 0.15)).toFixed(2)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.85 }}>Fixed Customer / Meter Fee:</span>
                <b>${cur.fixedCharges?.toFixed(2) || '0.00'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.85 }}>Estimated Taxes &amp; Surcharges:</span>
                <b>${cur.taxAmount?.toFixed(2) || '0.00'}</b>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Tariff Source:</span>
                <span style={{ fontSize: '.8rem', textDecoration: 'underline' }}>{cur.tariffSource}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button
              className="m3-btn filled invert"
              style={{ flex: 1 }}
              onClick={() => setSnack('Payment portal integration nominal. Forecast updated.')}
            >
              Pay Now (${cur.amount?.toFixed(2)})
            </button>
            <button
              className="m3-btn outlined"
              style={{ borderColor: 'currentColor', color: 'inherit' }}
              onClick={() => fileInputRef.current?.click()}
            >
              Update Bill Image
            </button>
          </div>
        </div>

        {/* Card 2: Upload Dropzone & Extraction Engine */}
        <div className="m3-card outlined" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-top">
              <h3 className="m3-headline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} /> Bill OCR Scanner
              </h3>
              <span className="m3-chip">
                <Sparkles size={13} style={{ marginRight: 4 }} /> RapidOCR ONNX
              </span>
            </div>
            <p className="m3-body" style={{ margin: '4px 0 16px' }}>
              Drop an image or PDF of your monthly electricity bill. The neural model extracts consumption slabs and tariffs automatically.
            </p>

            {/* Drop area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
                borderRadius: 16,
                padding: '30px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragActive ? 'var(--md-sys-color-surface-container-high)' : 'var(--md-sys-color-surface-container-low)',
                transition: 'all .2s ease',
              }}
            >
              {uploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <RefreshCw size={36} className="spin" style={{ color: 'var(--md-sys-color-primary)' }} />
                  <h4 className="m3-title" style={{ margin: 0 }}>Scanning electricity bill...</h4>
                  <p className="m3-body" style={{ margin: 0, fontSize: '.85rem' }}>
                    Extracting units, rate per kWh, and fixed charges with OCR...
                  </p>
                </div>
              ) : previewUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left' }}>
                  <img
                    src={previewUrl}
                    alt="Bill Preview"
                    style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--md-sys-color-outline)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div className="m3-title" style={{ fontSize: '.95rem' }}>Bill Image Selected</div>
                    <div className="m3-body" style={{ fontSize: '.82rem' }}>Click or drop another file to replace</div>
                  </div>
                  <span className="m3-btn tonal" style={{ padding: '6px 12px', fontSize: '.82rem' }}>Change</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%',
                    background: 'var(--md-sys-color-surface-container-highest)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Upload size={24} style={{ color: 'var(--md-sys-color-primary)' }} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--md-sys-color-primary)' }}>Click to upload bill</span>
                    <span className="m3-body"> or drag and drop</span>
                  </div>
                  <div className="m3-body" style={{ fontSize: '.78rem', opacity: 0.7 }}>
                    Supports PNG, JPG, JPEG, WEBP, and PDF
                  </div>
                </div>
              )}
            </div>

            {/* Extracted Bill Review Form */}
            {extractedData && (
              <form onSubmit={handleConfirmBill} style={{ marginTop: 18, background: 'var(--md-sys-color-surface-container)', padding: 16, borderRadius: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 className="m3-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontSize: '.95rem' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--md-sys-color-primary)' }} />
                    Extracted Billing Data
                  </h4>
                  <button
                    type="button"
                    className="m3-btn text"
                    style={{ padding: '4px 8px', fontSize: '.8rem' }}
                    onClick={() => { setExtractedData(null); setPreviewUrl(null) }}
                  >
                    <X size={14} /> Clear
                  </button>
                </div>

                <div className="grid grid-2" style={{ gap: 10 }}>
                  <div>
                    <label className="m3-label" style={{ fontSize: '.75rem' }}>Bill Month</label>
                    <input
                      type="text"
                      className="m3-input"
                      value={extractedData.month_label}
                      onChange={(e) => setExtractedData({ ...extractedData, month_label: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: '.88rem' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="m3-label" style={{ fontSize: '.75rem' }}>Billed Energy (kWh)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="m3-input"
                      value={extractedData.energy_kwh}
                      onChange={(e) => setExtractedData({ ...extractedData, energy_kwh: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: '.88rem' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="m3-label" style={{ fontSize: '.75rem' }}>Billed Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="m3-input"
                      value={extractedData.amount_usd}
                      onChange={(e) => setExtractedData({ ...extractedData, amount_usd: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: '.88rem' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="m3-label" style={{ fontSize: '.75rem' }}>Rate per kWh ($/kWh)</label>
                    <input
                      type="number"
                      step="0.001"
                      className="m3-input"
                      value={extractedData.rate_per_kwh}
                      onChange={(e) => setExtractedData({ ...extractedData, rate_per_kwh: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: '.88rem' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="m3-label" style={{ fontSize: '.75rem' }}>Fixed Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="m3-input"
                      value={extractedData.fixed_charges}
                      onChange={(e) => setExtractedData({ ...extractedData, fixed_charges: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: '.88rem' }}
                    />
                  </div>
                  <div>
                    <label className="m3-label" style={{ fontSize: '.75rem' }}>Due Date</label>
                    <input
                      type="text"
                      className="m3-input"
                      value={extractedData.due_date}
                      onChange={(e) => setExtractedData({ ...extractedData, due_date: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: '.88rem' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                  <button type="submit" className="m3-btn filled" style={{ flex: 1 }}>
                    <CheckCircle2 size={16} /> Confirm &amp; Save to History
                  </button>
                  {extractedData.image_path && (
                    <button
                      type="button"
                      className="m3-btn tonal"
                      onClick={() => setActiveImageModal(extractedData.image_path)}
                    >
                      <Eye size={15} /> View Image
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: '.8rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
            <AlertCircle size={14} />
            <span>Extracted parameters instantly tune the live predictive billing engine.</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Past Bills History & Savings Analytics */}
      <div className="grid grid-3" style={{ marginTop: 24 }}>
        {/* Past Bills Table */}
        <div className="m3-card filled" style={{ gridColumn: 'span 2' }}>
          <div className="card-top">
            <div>
              <h3 className="m3-headline">Historical Utility Statements</h3>
              <p className="m3-body">Past bills recorded and processed through the OCR extractor.</p>
            </div>
            <span className="m3-chip">{bills.past?.length || 0} Records</span>
          </div>

          {bills.past && bills.past.length > 0 ? (
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table className="m3-table">
                <thead>
                  <tr>
                    <th>Statement Period</th>
                    <th>Consumption</th>
                    <th>Extracted Tariff</th>
                    <th>Fixed Fee</th>
                    <th>Total Billed</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.past.map((b) => (
                    <tr key={b.id || b.month}>
                      <td>
                        <b>{b.month}</b><br />
                        <span className="m3-body" style={{ fontSize: '.78rem' }}>{b.due}</span>
                      </td>
                      <td>
                        <b>{b.energyKwh?.toFixed(1) || '--'} kWh</b>
                      </td>
                      <td>
                        <span>${b.ratePerKwh?.toFixed(3) || '0.150'} / kWh</span>
                      </td>
                      <td>
                        <span>${b.fixedCharges?.toFixed(2) || '0.00'}</span>
                      </td>
                      <td>
                        <b style={{ fontSize: '1rem' }}>${b.amount?.toFixed(2)}</b><br />
                        <span className="status-pill paid" style={{ fontSize: '.72rem', padding: '2px 8px' }}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {b.imagePath && (
                            <button
                              className="m3-btn text"
                              title="View uploaded bill"
                              style={{ padding: 6 }}
                              onClick={() => setActiveImageModal(b.imagePath)}
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          {b.id && (
                            <button
                              className="m3-btn text"
                              title="Delete statement"
                              style={{ padding: 6, color: 'var(--md-sys-color-error)' }}
                              onClick={() => handleDeleteBill(b.id, b.month)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '36px 16px', textAlign: 'center', opacity: 0.8 }}>
              <FileText size={40} style={{ opacity: 0.4, marginBottom: 8 }} />
              <h4 className="m3-title" style={{ margin: 0 }}>No Bill Statements Uploaded Yet</h4>
              <p className="m3-body" style={{ maxWidth: 420, margin: '6px auto 14px' }}>
                Upload an electricity bill from last month to establish your utility tariff baseline.
              </p>
              <button
                className="m3-btn tonal"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} /> Upload First Bill
              </button>
            </div>
          )}
        </div>

        {/* Savings & Sustainability Promo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="m3-card filled">
            <div className="m3-label">Monthly Efficiency</div>
            <h3 className="m3-headline">Projected Savings</h3>
            <div className="kpi good" style={{ fontSize: '2.4rem' }}>
              ${bills.savings?.toFixed(2) || '0.00'}
            </div>
            <div className="kpi-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingDown size={14} />
              <span>Compared to baseline bill</span>
            </div>
            <p className="m3-body" style={{ fontSize: '.84rem', marginTop: 10 }}>
              Energy efficiency optimizations based on live sensor monitoring and transformer load balancing.
            </p>
          </div>

          <div className="m3-card primary-tint">
            <div className="m3-label" style={{ color: 'inherit' }}>Grid Sustainable Energy</div>
            <h3 className="m3-headline">Green Energy Surcharge Credit</h3>
            <p className="m3-body" style={{ color: 'inherit', opacity: 0.9 }}>
              Off-peak consumption reduces grid transformer thermal stress and qualifies for municipal rebate credits.
            </p>
            <div className="promo-row" style={{ marginTop: 12 }}>
              <button className="m3-btn filled invert" onClick={() => setSnack('Enrolled in Peak Shaving Rebates')}>
                Enroll Rebate <ArrowRight size={14} />
              </button>
              <div className="promo-img"><Leaf size={38} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Image View Dialog */}
      {activeImageModal && (
        <Dialog
          title="Electricity Bill Statement Document"
          onClose={() => setActiveImageModal(null)}
          actions={
            <button className="m3-btn filled" onClick={() => setActiveImageModal(null)}>
              Close
            </button>
          }
        >
          <div style={{ textAlign: 'center', maxHeight: '75vh', overflowY: 'auto' }}>
            {activeImageModal.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={activeImageModal}
                title="PDF Statement"
                style={{ width: '100%', height: '500px', border: 'none', borderRadius: 8 }}
              />
            ) : (
              <img
                src={activeImageModal}
                alt="Bill Statement"
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 8 }}
              />
            )}
          </div>
        </Dialog>
      )}

      {snack && <Snackbar message={snack} onAction={() => setSnack('')} actionLabel="Dismiss" />}
    </>
  )
}
