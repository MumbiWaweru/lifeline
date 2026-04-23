export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const APP_NAME = 'Lifeline'
export const DEFAULT_LANGUAGE = 'en'

export const RISK_LEVELS = {
  green: { label: 'Low Risk', color: '#22c55e' },
  amber: { label: 'Medium Risk', color: '#f59e0b' },
  red: { label: 'High Risk', color: '#ef4444' },
}

export const STORAGE_KEYS = {
  ADMIN_TOKEN: 'lifeline_admin_token',
  SESSION_ID: 'lifeline_session_id',
  LANGUAGE: 'lifeline_lang',
}

export function getSessionId() {
  let id = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID)
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, id)
  }
  return id
}