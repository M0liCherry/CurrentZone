import * as mockData from '../data/mockData'
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
  if (s.includes('alert') || s.includes('budget') || s.includes('warning')) return TriangleAlert
  if (s.includes('ac') || s.includes('cool') || s.includes('temp')) return Snowflake
  if (s.includes('bill') || s.includes('receipt') || s.includes('cost')) return Receipt
  if (s.includes('tip') || s.includes('save')) return Lightbulb
  return Bell
}

async function request(endpoint, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 4000)

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
    clearTimeout(timeoutId)
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`)
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

  // Devices & Smart Plugs
  async getDevices() {
    try {
      const raw = await request('/api/devices/')
      return raw.map(d => ({
        id: d.id,
        name: d.name,
        room: d.room || 'General',
        icon: getDeviceIcon(d.name, d.device_type),
        on: d.is_online,
        watts: d.current_power_w || (d.is_online ? 120 : 0),
        todayKwh: Number((d.daily_kwh || (d.is_online ? 1.5 : 0)).toFixed(1)),
        currentAmps: d.current_amps,
        zone: d.zone,
      }))
    } catch (err) {
      console.warn('Backend unavailable, using mock devices', err)
      return mockData.devices
    }
  },

  async registerDevice(device) {
    return await request('/api/devices/register', {
      method: 'POST',
      body: JSON.stringify(device),
    })
  },

  async connectDevice(deviceId) {
    try {
      return await request(`/api/devices/${encodeURIComponent(deviceId)}/connect`, {
        method: 'POST',
      })
    } catch {
      return {
        success: true,
        device_id: deviceId,
        pairing_status: 'CONNECTED',
        message: 'Device connected in offline simulation mode.',
      }
    }
  },

  // Usage Analytics
  async getDailyUsage() {
    try {
      const data = await request('/api/usage/daily')
      const slots = data.slots || data.chart || []
      return {
        averageDailyUseKwh: data.average_daily_kwh || data.average_daily_use_kwh || 28,
        dailyChangePct: data.average_change_pct || data.daily_change_pct || 20.0,
        comparedToYesterdayKwh: data.compared_to_yesterday_kwh || 5.0,
        peakWindow: data.peak_window || '4PM – 8PM',
        chart: slots.map(c => ({ t: c.time_label || c.time_slot || c.t, kwh: c.kwh })),
      }
    } catch {
      return {
        averageDailyUseKwh: 28,
        dailyChangePct: 20.0,
        comparedToYesterdayKwh: 5.0,
        peakWindow: '4PM – 8PM',
        chart: mockData.dailyUsage,
      }
    }
  },

  async getWeeklyUsage() {
    try {
      const data = await request('/api/usage/weekly')
      const days = data.days || data.chart || []
      return {
        totalWeeklyKwh: data.total_week_kwh || data.total_weekly_kwh || 186.0,
        chart: days.map(c => ({ d: c.day || c.day_label || c.d, kwh: c.kwh })),
      }
    } catch {
      return {
        totalWeeklyKwh: 186.0,
        chart: mockData.weeklyUsage,
      }
    }
  },

  async getMonthlyUsage() {
    try {
      const data = await request('/api/usage/monthly')
      const months = data.months || data.chart || []
      return {
        totalAnnualKwh: data.total_year_kwh || data.total_annual_kwh || 3710.0,
        chart: months.map(c => ({ m: c.month || c.month_label || c.m, kwh: c.kwh })),
      }
    } catch {
      return {
        totalAnnualKwh: 3710.0,
        chart: mockData.monthlyUsage,
      }
    }
  },

  // Insights
  async getBedroomInsights() {
    try {
      const data = await request('/api/insights/bedroom')
      const breakdown = data.plug_breakdown || data.plugs || []
      return {
        totalKwh: data.total_kwh || data.total_consumption_kwh || 120,
        peakKwh: data.peak_kwh || data.peak_consumption_kwh || 50,
        ratingAverage: data.rating || data.rating_average || 4.5,
        totalReviews: data.reviews_count || data.total_reviews || 120,
        plugs: breakdown.map(p => ({
          name: p.name || p.plug_name,
          kwh: p.kwh,
          pct: p.percentage || p.percentage_share || 0,
        })),
      }
    } catch {
      return {
        totalKwh: 120,
        peakKwh: 50,
        ratingAverage: 4.5,
        totalReviews: 120,
        plugs: [
          { name: 'A.C.', kwh: 45, pct: 37.5 },
          { name: 'Fan', kwh: 30, pct: 25.0 },
          { name: 'Light A', kwh: 25, pct: 20.8 },
        ],
      }
    }
  },

  // Billing & Cost Estimation
  async getBillingSummary() {
    try {
      const data = await request('/api/billing/summary')
      return {
        current: {
          amount: data.current_bill.estimated_amount_usd,
          due: data.current_bill.due_date,
          status: data.current_bill.status,
        },
        past: data.past_bills.map(b => ({
          month: b.billing_cycle,
          due: b.due_date,
          status: b.status,
          amount: b.amount_usd,
        })),
        savings: data.estimated_savings_this_month_usd,
      }
    } catch {
      return mockData.bills
    }
  },

  // Budget & Alerts
  async getBudget() {
    try {
      const data = await request('/api/budgets/')
      return {
        monthlyBudget: data.monthly_budget_usd,
        currentSpent: data.current_spent_usd,
        remaining: data.remaining_budget_usd,
        percentageUsed: data.percentage_used,
        alertTriggered: data.alert_triggered,
        status: data.status,
      }
    } catch {
      return {
        monthlyBudget: 150,
        currentSpent: 118,
        remaining: 32,
        percentageUsed: 79,
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
        currentSpent: data.current_spent_usd,
        remaining: data.remaining_budget_usd,
        percentageUsed: data.percentage_used,
        alertTriggered: data.alert_triggered,
        status: data.status,
      }
    } catch {
      return {
        monthlyBudget: payload.monthly_budget_usd,
        currentSpent: 118,
        remaining: Math.max(0, payload.monthly_budget_usd - 118),
        percentageUsed: Math.min(100, Math.round((118 / payload.monthly_budget_usd) * 100)),
        alertTriggered: false,
        status: 'ON_TRACK',
      }
    }
  },

  // Notifications
  async getNotifications() {
    try {
      const raw = await request('/api/notifications/')
      return raw.map(n => ({
        id: n.id,
        title: n.title,
        desc: n.description,
        category: n.category,
        time: n.time_label,
        unread: !n.is_read,
        icon: getNotificationIcon(n.category, n.title),
      }))
    } catch {
      return mockData.notifications
    }
  },

  async markNotificationRead(id) {
    try {
      await request(`/api/notifications/${id}/read`, { method: 'POST' })
    } catch {
      // offline no-op
    }
  },

  // AI Outage Predictor & Grid Intelligence
  async getGridOverview() {
    try {
      return await request('/api/predictor/overview')
    } catch {
      return {
        status: 'simulated',
        monitored_transformers_count: 3,
        critical_risk_zones: 0,
        high_risk_zones: 1,
        overall_grid_status: 'STABLE',
        ambient_heat_index: 34.2,
        max_wind_gust_kmh: 22.0,
        zones: [
          {
            transformer_id: 'TX-RES-01',
            transformer_name: 'Substation Alpha - Residential South',
            zone: 'Residential South',
            risk_level: 'MODERATE',
            failure_probability_pct: 35.5,
            current_load_pct: 78.0,
            top_oil_temp_c: 88.5,
            estimated_ttf_minutes: null,
            all_mitigations: ['Monitor ambient heat rise', 'Maintain normal operating schedules'],
          },
          {
            transformer_id: 'TX-IND-04',
            transformer_name: 'Substation Gamma - Industrial Corridor',
            zone: 'Industrial Corridor',
            risk_level: 'HIGH',
            failure_probability_pct: 62.0,
            current_load_pct: 95.0,
            top_oil_temp_c: 101.2,
            estimated_ttf_minutes: 145,
            all_mitigations: ['Engage forced-air cooling fans', 'Alert industrial dispatch to curtail peak load'],
          },
        ],
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
    try {
      return await request('/api/predictor/simulate', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    } catch {
      // Offline fallback computation
      const load = payload.current_rms ? (payload.current_rms / 100.0) * 100 : 85.0
      const prob = Math.min(99.0, Math.round(load * 0.4 + (payload.ambient_temp_c || 25) * 1.2 + (payload.wind_gust_kmh || 10) * 0.3))
      return {
        zone: payload.zone || 'Residential South',
        transformer_id: payload.transformer_id || 'TX-RES-01',
        failure_probability_pct: prob,
        risk_level: prob > 70 ? 'CRITICAL' : prob > 45 ? 'HIGH' : 'MODERATE',
        estimated_ttf_minutes: prob > 60 ? Math.max(15, Math.round(300 - prob * 2.5)) : null,
        simulated_load_pct: Math.round(load),
        simulated_oil_temp_c: Number((65 + (load * 0.35) + ((payload.ambient_temp_c || 25) * 0.4)).toFixed(1)),
        primary_factors: ['Thermal load accumulation', 'Weather ambient heat'],
        mitigation_actions: ['Initiate selective load shedding', 'Dispatch field inspection team'],
      }
    }
  },

  // User Profile / Auth
  async getUserProfile() {
    try {
      const data = await request('/api/auth/me')
      return {
        name: data.full_name,
        username: data.username,
        email: data.email,
        initials: data.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        role: data.role,
        zone: data.zone,
        householdSize: data.household_size,
      }
    } catch {
      return mockData.user
    }
  },
}
