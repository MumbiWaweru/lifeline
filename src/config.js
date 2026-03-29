/**
 * Application Configuration
 */

// Backend API base URL - Change for production
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// App settings
export const APP_NAME = 'Lifeline';
export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = ['en', 'sw'];

// Risk level mappings
export const RISK_LEVELS = {
  green: { label: 'Low Risk', color: 'success', icon: '🟢' },
  amber: { label: 'Medium Risk', color: 'warning', icon: '🟡' },
  red: { label: 'High Risk', color: 'danger', icon: '🔴' },
};

// Resource type mappings
export const RESOURCE_TYPES = {
  hotline: { label: 'Hotline', icon: '📞', color: 'info' },
  shelter: { label: 'Shelter', icon: '🏠', color: 'success' },
  organization: { label: 'Organization', icon: '🏢', color: 'primary' },
  legal: { label: 'Legal Aid', icon: '⚖️', color: 'secondary' },
  police: { label: 'Police', icon: '👮', color: 'danger' },
};

// Session storage keys
export const STORAGE_KEYS = {
  ADMIN_TOKEN: 'admin_token',
  SESSION_ID: 'session_id',
  LANGUAGE: 'language',
};

// Generate or get session ID
export function getSessionId() {
  let sessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  }
  return sessionId;
}
