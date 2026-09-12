import {
  Refrigerator, Tv, Lamp, AirVent, Fan, Flame, Plug, Zap,
  TriangleAlert, Snowflake, Receipt, Lightbulb, Bell, CircleDollarSign
} from 'lucide-react'

const BASE_URL = '' // Uses Vite proxy in development or same host in production

const iconMap = {
  fridge: Refrigerator,
  refrigerator: Refrigerator,
  tv: Tv,
  television: Tv,
  lamp: Lamp,
  light: Lamp,
  ac: AirVent,
  air_conditioner: AirVent,
  fan: Fan,
  heater: Flame,
  water_heater: Flame,
  sct: Zap,
  sensor: Zap,
  monitor: Zap,
  default: Plug,
}

export function getDeviceIcon(name = '', type = '') {
  const key = (type || name).toLowerCase().replace(/[^a-z]/g, '_')
  for (const [k, Icon] of Object.entries(iconMap)) {
    if (key.includes(k)) return Icon
  }
  return Plug
}

export function getNotificationIcon(category = '', title = '') {
  const s = (category + ' ' + title).toLowerCase()
  if (s.includes('alert') || s.includes('budget') || s.includes('warning') || s.includes('risk')) return TriangleAlert
  if (s.includes('ac') || s.includes('cool') || s.includes('temp')) return Snowflake
  if (s.includes('bill') || s.includes('receipt') || s.includes('cost')) return Receipt
  if (s.includes('tip') || s.includes('save')) return Lightbulb
  return Bell
}

async function request(endpoint, options = {}) {
  const timeoutMs = options.timeout || 5000
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const headers = { ...(options.headers || {}) }
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers,
    })
    clearTimeout(timeoutId)
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.detail || `API error ${res.status}: ${res.statusText}`)
    }
    return await res.json()
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

export const api = {
  // Health & Connectivity Check
  async checkHealth() {
    try {
      const data = await request('/health')
      return { online: true, service: data.service, status: data.status }
    } catch {
      return { online: false }
    }
  },

  // Devices & Smart Plugs (backed by ESP32 / real external devices)
  async getDevices() {
    try {
      const raw = await request('/api/devices/')
      return (raw || []).map(d => ({
        id: d.id,
        name: d.name,
        room: d.room || 'General',
        icon: getDeviceIcon(d.name, d.device_type),
        on: Boolean(d.is_online),
        watts: d.current_power_w || 0,
        todayKwh: Number((d.daily_kwh || 0).toFixed(2)),
        currentAmps: d.current_amps || 0,
        zone: d.zone,
      }))
    } catch (err) {
      return []
    }
  },

  async registerDevice(device) {
    return await request('/api/devices/register', {
      method: 'POST',
      body: JSON.stringify(device),
    })
  },

  async connectDevice(deviceId) {
    return await request(`/api/devices/${encodeURIComponent(deviceId)}/connect`, {
      method: 'POST',
    })
  },

  // Usage Analytics (dynamically computed from telemetry readings)
  async getDailyUsage() {
    try {
      const data = await request('/api/usage/daily')
      const slots = data.slots || []
      return {
        averageDailyUseKwh: data.average_daily_kwh || 0,
        dailyChangePct: data.average_change_pct || 0,
        comparedToYesterdayKwh: data.compared_to_yesterday_kwh || 0,
        peakWindow: data.peak_window || '--',
        chart: slots.map(c => ({ t: c.time_label || c.t, kwh: c.kwh || 0 })),
      }
    } catch {
      return {
        averageDailyUseKwh: 0,
        dailyChangePct: 0,
        comparedToYesterdayKwh: 0,
        peakWindow: '--',
        chart: [],
      }
    }
  },

  async getWeeklyUsage() {
    try {
      const data = await request('/api/usage/weekly')
      const days = data.days || []
      return {
        totalWeeklyKwh: data.total_week_kwh || 0,
        chart: days.map(c => ({ d: c.day || c.d, kwh: c.kwh || 0 })),
      }
    } catch {
      return {
        totalWeeklyKwh: 0,
        chart: [],
      }
    }
  },

  async getMonthlyUsage() {
    try {
      const data = await request('/api/usage/monthly')
      const months = data.months || []
      return {
        totalAnnualKwh: data.total_year_kwh || 0,
        chart: months.map(c => ({ m: c.month || c.m, kwh: c.kwh || 0 })),
      }
    } catch {
      return {
        totalAnnualKwh: 0,
        chart: [],
      }
    }
  },

  // Insights (dynamically computed from real devices and telemetry)
  async getBedroomInsights() {
    try {
      const data = await request('/api/insights/bedroom')
      const breakdown = data.plug_breakdown || []
      return {
        totalKwh: data.total_kwh || 0,
        peakKwh: data.peak_kwh || 0,
        ratingAverage: data.rating || 5.0,
        totalReviews: data.reviews_count || breakdown.length,
        plugs: breakdown.map(p => ({
          name: p.name || 'Device',
          kwh: p.kwh || 0,
          pct: p.percentage || 0,
        })),
      }
    } catch {
      return {
        totalKwh: 0,
        peakKwh: 0,
        ratingAverage: 5.0,
        totalReviews: 0,
        plugs: [],
      }
    }
  },

  // Dynamic Recommendations (computed from real telemetry & tariffs)
  async getRecommendations() {
    try {
      const data = await request('/api/insights/recommendations')
      return {
        totalSavings: data.total_potential_savings_usd || 0,
        summary: data.summary || 'Derived from live ESP32 telemetry',
        tips: data.tips || [],
      }
    } catch {
      return {
        totalSavings: 0,
        summary: 'Derived from live ESP32 telemetry',
        tips: [],
      }
    }
  },

  // Billing & Cost Estimation (computed from real energy * tariff)
  async getBillingSummary() {
    try {
      const data = await request('/api/billing/summary')
      return {
        current: {
          amount: data.current_bill?.estimated_bill_usd || 0,
          due: data.current_bill?.due_date || 'Due Next Cycle',
          projectedKwh: data.current_bill?.projected_kwh || 0,
          kwhSoFar: data.current_bill?.kwh_so_far || 0,
          ratePerKwh: data.current_bill?.rate_per_kwh || 0.15,
          fixedCharges: data.current_bill?.fixed_charges || 0,
          taxAmount: data.current_bill?.tax_amount || 0,
          tariffSource: data.current_bill?.tariff_source || 'Standard Utility Tariff',
          daysElapsed: data.current_bill?.days_elapsed || 1,
          daysRemaining: data.current_bill?.days_remaining || 29,
          status: 'Pending',
        },
        past: (data.past_bills || []).map(b => ({
          id: b.id,
          month: b.month_year || b.billing_cycle,
          due: b.due_date,
          status: b.status,
          amount: b.amount_usd,
          energyKwh: b.energy_kwh || 0,
          ratePerKwh: b.rate_per_kwh || 0.15,
          fixedCharges: b.fixed_charges || 0,
          imagePath: b.image_path,
        })),
        savings: data.estimated_savings_this_month_usd || 0,
      }
    } catch {
      return {
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
          status: 'Pending',
        },
        past: [],
        savings: 0,
      }
    }
  },

  async uploadBill(file) {
    const formData = new FormData()
    formData.append('file', file)
    return await request('/api/billing/upload-bill', {
      method: 'POST',
      body: formData,
      timeout: 30000,
    })
  },

  async confirmBill(billData) {
    return await request('/api/billing/confirm-bill', {
      method: 'POST',
      body: JSON.stringify(billData),
    })
  },

  async deleteBill(billId) {
    return await request(`/api/billing/${billId}`, {
      method: 'DELETE',
    })
  },

  // Budget & Alerts
  async getBudget() {
    try {
      const data = await request('/api/budgets/')
      return {
        monthlyBudget: data.monthly_budget_usd || 150,
        currentSpent: data.current_spent_usd || 0,
        remaining: data.remaining_budget_usd ?? 150,
        percentageUsed: data.percentage_used || 0,
        alertTriggered: Boolean(data.alert_triggered),
        status: data.status || 'ON_TRACK',
      }
    } catch {
      return {
        monthlyBudget: 150,
        currentSpent: 0,
        remaining: 150,
        percentageUsed: 0,
        alertTriggered: false,
        status: 'ON_TRACK',
      }
    }
  },

  async updateBudget(payload) {
    try {
      const data = await request('/api/budgets/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return {
        monthlyBudget: data.monthly_budget_usd,
        currentSpent: data.current_spent_usd || 0,
        remaining: data.remaining_budget_usd,
        percentageUsed: data.percentage_used || 0,
        alertTriggered: Boolean(data.alert_triggered),
        status: data.status || 'ON_TRACK',
      }
    } catch {
      return {
        monthlyBudget: payload.monthly_budget_usd || 150,
        currentSpent: 0,
        remaining: payload.monthly_budget_usd || 150,
        percentageUsed: 0,
        alertTriggered: false,
        status: 'ON_TRACK',
      }
    }
  },

  // Notifications (dynamically logged by backend)
  async getNotifications() {
    try {
      const raw = await request('/api/notifications/')
      return (raw || []).map(n => ({
        id: n.id,
        title: n.title,
        desc: n.description,
        category: n.category,
        time: n.time_label,
        unread: !n.is_read,
        icon: getNotificationIcon(n.category, n.title),
      }))
    } catch {
      return []
    }
  },

  async markNotificationRead(id) {
    try {
      await request(`/api/notifications/${id}/read`, { method: 'POST' })
    } catch {
      // no-op
    }
  },

  // AI Outage Predictor & Grid Intelligence
  async getGridOverview() {
    try {
      return await request('/api/predictor/overview')
    } catch {
      return {
        status: 'offline',
        monitored_transformers_count: 0,
        critical_risk_zones: 0,
        high_risk_zones: 0,
        overall_grid_status: 'STABLE',
        ambient_heat_index: 25.0,
        max_wind_gust_kmh: 0,
        zones: [],
      }
    }
  },

  async getZonesRisk() {
    try {
      return await request('/api/predictor/zones')
    } catch {
      return []
    }
  },

  async simulateScenario(payload) {
    return await request('/api/predictor/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  // User Profile
  async getUserProfile() {
    try {
      const data = await request('/api/auth/me')
      return {
        name: data.full_name || 'User',
        username: data.username || 'user',
        email: data.email || '',
        initials: (data.full_name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        phone: data.phone || '',
        birthday: data.birthday || '',
      }
    } catch {
      return {
        name: 'User',
        username: 'user',
        email: '',
        initials: 'U',
        phone: '',
        birthday: '',
      }
    }
  },
}
