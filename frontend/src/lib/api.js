/**
 * Minimal SmartWatt backend client.
 * In dev, vite proxies `/api` -> http://localhost:8000 (see vite.config.js).
 * In production set VITE_API_BASE_URL to the deployed backend origin.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Backend ${res.status}: ${text || res.statusText}`)
  }
  return res.json()
}

export const DEFAULT_DEVICE_ID = 'esp32_sct013_res_01'

export function connectDevice(deviceId = DEFAULT_DEVICE_ID) {
  return request(`/api/devices/${encodeURIComponent(deviceId)}/connect`, { method: 'POST' })
}

export function latestTelemetry(transformerId) {
  const q = transformerId ? `?transformer_id=${encodeURIComponent(transformerId)}` : ''
  return request(`/api/telemetry/latest${q}`)
}

