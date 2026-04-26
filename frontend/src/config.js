export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const APP_NAME = 'Lifeline'
export const DEFAULT_LANGUAGE = 'en'

// 4-level risk system — matches backend claude.py and report spec
export const RISK_LEVELS = {
  low:      { label: 'Low',      color: '#3B6D11', bg: '#EAF3DE' },
  medium:   { label: 'Medium',   color: '#854F0B', bg: '#FAEEDA' },
  high:     { label: 'High',     color: '#A32D2D', bg: '#FCEBEB' },
  critical: { label: 'Critical', color: '#7B1C1C', bg: '#F7C1C1' },
}

export const STORAGE_KEYS = {
  ADMIN_TOKEN: 'lifeline_admin_token',
  SESSION_ID:  'lifeline_session_id',
  LANGUAGE:    'lifeline_lang',
}

export function getSessionId() {
  let id = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID)
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, id)
  }
  return id
}