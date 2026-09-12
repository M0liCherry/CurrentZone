// Mock data derived from the phone-screen reference images.
// Icons are Lucide component references (no emoji).
import {
  Activity, Bell, CircleDollarSign, History, Lightbulb,
  PlugZap, Refrigerator, Tv, Lamp, AirVent, Fan, Flame,
  Receipt, Settings, Snowflake, TriangleAlert,
} from 'lucide-react'

export const user = {
  name: 'Leslie Rasmund',
  username: 'leslie094',
  birthday: 'July 17, 1989',
  mobile: '(405) 439 - 3985',
  email: 'leslie@gmail.com',
  initials: 'LR',
}

export const devices = [
  { id: 'fridge', name: 'Smart Fridge', room: 'Kitchen', icon: Refrigerator, on: true, watts: 180, todayKwh: 4.2 },
  { id: 'tv', name: 'Smart TV', room: 'Living Room', icon: Tv, on: true, watts: 120, todayKwh: 1.8 },
  { id: 'lamp', name: 'Smart Lamp', room: 'Bedroom', icon: Lamp, on: false, watts: 12, todayKwh: 0.3 },
  { id: 'ac', name: 'Bedroom AC', room: 'Bedroom', icon: AirVent, on: true, watts: 1500, todayKwh: 9.6 },
  { id: 'fan', name: 'Ceiling Fan', room: 'Bedroom', icon: Fan, on: true, watts: 75, todayKwh: 1.1 },
  { id: 'heater', name: 'Water Heater', room: 'Utility', icon: Flame, on: false, watts: 2000, todayKwh: 3.4 },
]

export const deviceHistory = [
  { id: 1, name: 'Smart TV', range: 'Last 7 Days', icon: Tv, kwh: 12.6 },
  { id: 2, name: 'Smart Fridge', range: 'Last 30 Days', icon: Refrigerator, kwh: 118.4 },
]

export const dailyUsage = [
  { t: '12AM', kwh: 18 }, { t: '4AM', kwh: 22 }, { t: '8AM', kwh: 20 },
  { t: '12PM', kwh: 24 }, { t: '4PM', kwh: 26 }, { t: '8PM', kwh: 28 },
]

export const weeklyUsage = [
  { d: 'Mon', kwh: 24 }, { d: 'Tue', kwh: 27 }, { d: 'Wed', kwh: 25 },
  { d: 'Thu', kwh: 29 }, { d: 'Fri', kwh: 22 }, { d: 'Sat', kwh: 31 }, { d: 'Sun', kwh: 28 },
]

export const monthlyUsage = [
  { m: 'Jan', kwh: 320 }, { m: 'Feb', kwh: 280 }, { m: 'Mar', kwh: 310 },
  { m: 'Apr', kwh: 260 }, { m: 'May', kwh: 340 }, { m: 'Jun', kwh: 300 },
  { m: 'Jul', kwh: 360 }, { m: 'Aug', kwh: 330 }, { m: 'Sep', kwh: 290 },
  { m: 'Oct', kwh: 310 }, { m: 'Nov', kwh: 270 }, { m: 'Dec', kwh: 350 },
]

export const plugBreakdown = [
  { name: 'Light A', kwh: 25 },
  { name: 'Fan', kwh: 30 },
  { name: 'AC', kwh: 45 },
]

export const plugComparison = [
  { name: 'Light', kwh: 12 },
  { name: 'A.C.', kwh: 50 },
  { name: 'Fan', kwh: 28 },
]

export const ratingBars = [
  { stars: 5, pct: 35 }, { stars: 4, pct: 30 }, { stars: 3, pct: 20 },
  { stars: 2, pct: 10 }, { stars: 1, pct: 5 },
]

export const bills = {
  current: { amount: 123.5, due: 'Due Oct 15' },
  past: [
    { month: 'Oct 2023', due: 'Nov 15', status: 'Paid', amount: 150.2 },
    { month: 'Sep 2023', due: 'Oct 15', status: 'Paid', amount: 135.75 },
    { month: 'Aug 2023', due: 'Sep 15', status: 'Paid', amount: 160.4 },
  ],
  savings: 20,
}

export const notifications = [
  { id: 1, title: 'Budget alert: 80% used', desc: 'You have used 80% of your $150 October budget.', time: '9:41 AM', unread: true, icon: TriangleAlert },
  { id: 2, title: 'AC consumed 45 kWh this week', desc: 'Bedroom AC is your top consumer (+15% vs last week).', time: '9:41 AM', unread: true, icon: Snowflake },
  { id: 3, title: 'Bill ready: $123.50 due Oct 15', desc: 'Your estimated bill for this cycle is available.', time: '9:41 AM', unread: false, icon: Receipt },
  { id: 4, title: 'New tip: save $20 this month', desc: 'Switch the water heater to eco mode to save ~$20.', time: '9:41 AM', unread: false, icon: Lightbulb },
]

export const recommendations = [
  { icon: Activity, title: 'Live Usage Monitor', desc: 'Monitor energy usage in real-time' },
  { icon: PlugZap, title: 'Appliance Insights', desc: 'Detailed insights for connected devices' },
  { icon: CircleDollarSign, title: 'Billing & Cost Estimation', desc: 'Estimate energy costs and billing' },
  { icon: Bell, title: 'Set Budget & Get Alerts', desc: 'Set energy budget and receive alerts' },
  { icon: Lightbulb, title: 'Save Energy Recommendations', desc: 'Personalized energy-saving tips' },
  { icon: History, title: 'Historical Data', desc: 'View past energy usage data' },
  { icon: Settings, title: 'Settings & Preferences', desc: 'Adjust app settings and preferences' },
]

export const savingTips = [
  { title: 'Switch water heater to eco mode', save: '≈ $20/mo', impact: 90, desc: 'Biggest single saving in your home profile.' },
  { title: 'AC setpoint 24°C instead of 21°C', save: '≈ $14/mo', impact: 72, desc: 'Cuts AC load by ~18% with no comfort loss.' },
  { title: 'Replace 4 halogen bulbs with LED', save: '≈ $8/mo', impact: 55, desc: 'Lighting drops from 180W to 36W.' },
  { title: 'Enable standby killer on TV setup', save: '≈ $5/mo', impact: 40, desc: 'Eliminates 12W phantom load overnight.' },
]
