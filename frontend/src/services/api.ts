// api.ts
// Centralised API client with React Query hooks, JWT management, auto-expiry,
// and plain function exports (adminApi, chatApi, counsellorsApi, resourcesApi, healthApi)
// that the JSX pages import directly.

import axios, { AxiosError } from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// ─── Axios instance ────────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token') || localStorage.getItem('lifeline_admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401: clear auth and redirect to login
apiClient.interceptors.response.use(
  r => r,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('lifeline_admin_token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(err)
  }
)


// ─── Types ─────────────────────────────────────────────────────────────────────
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type UserRole  = 'survivor' | 'counselor' | 'admin'

export interface RiskAssessmentResult {
  id: string
  risk_level: RiskLevel
  confidence: number
  explanation: Record<string, number>
  model_version: string
  processing_ms: number
}

export interface ResourceService {
  id: string
  name: string
  description: string | null
  service_type: string
  phone: string | null
  email: string | null
  website: string | null
  address: string | null
  county: string | null
  distance_km: number | null
  operating_hours: Record<string, string> | null
  languages: string[] | null
}

export interface Message {
  id: string
  sender_id: string | null
  sender_role: UserRole | null
  content: string
  auto_destruct_at: string | null
  created_at: string
}

export interface Case {
  id: string
  survivor_id: string | null
  counselor_id: string | null
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  risk_level: RiskLevel
  is_flagged: boolean
  created_at: string
  updated_at: string
}

export interface Alert {
  id: string
  case_id: string
  risk_level: RiskLevel
  risk_score: number
  explanation: Record<string, number>
  acknowledged: boolean
  created_at: string
}

export interface Conversation {
  session_id: string
  risk_level: RiskLevel
  language: string
  is_flagged?: boolean
  created_at: string
  messages: { sender: string; content: string; created_at: string }[]
}

export interface Counsellor {
  id: string
  name: string
  specialization?: string
  is_available: boolean
  organization?: string
}

export interface CounsellorRequest {
  id: string
  counsellor_id: string
  session_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}


// ─── Auth helpers ──────────────────────────────────────────────────────────────
export const getToken   = () => localStorage.getItem('token') || localStorage.getItem('lifeline_admin_token')
export const getRole    = () => localStorage.getItem('role') as UserRole | null
export const isLoggedIn = () => !!getToken()

export function logout() {
  apiClient.post('/auth/logout').finally(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('lifeline_admin_token')
    window.location.href = '/admin/login'
  })
}


// ─────────────────────────────────────────────────────────────────────────────
//  PLAIN FUNCTION EXPORTS
//  These are what your JSX pages import:
//  import { adminApi, chatApi, counsellorsApi, resourcesApi, healthApi } from '../../services/api'
// ─────────────────────────────────────────────────────────────────────────────

// ── healthApi ─────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () =>
    apiClient.get('/health').then(r => r.data),
}

// ── chatApi ───────────────────────────────────────────────────────────────────
export const chatApi = {
  sendMessage: (data: {
    message: string
    language?: string
    session_id: string
    name?: string
  }) =>
    apiClient.post('/chat', data).then(r => r.data),
}

// ── adminApi ──────────────────────────────────────────────────────────────────
export const adminApi = {
  login: (password: string) =>
    apiClient.post('/admin/login', { password }).then(r => {
      const token = r.data.token
      localStorage.setItem('lifeline_admin_token', token)
      return r.data
    }),

  logout: () => {
    localStorage.removeItem('lifeline_admin_token')
    window.location.href = '/admin/login'
  },

  getStats: () =>
    apiClient.get('/admin/stats').then(r => r.data),

  getConversations: (flaggedOnly = false) =>
    apiClient
      .get('/admin/conversations', { params: flaggedOnly ? { flagged: true } : {} })
      .then(r => r.data),

  getAlerts: () =>
    apiClient.get('/admin/alerts').then(r => r.data),

  acknowledgeAlert: (alertId: string) =>
    apiClient.post(`/admin/alerts/${alertId}/acknowledge`).then(r => r.data),

  getAnalytics: () =>
    apiClient.get('/admin/analytics').then(r => r.data),
}

// ── resourcesApi ──────────────────────────────────────────────────────────────
export const resourcesApi = {
  getByLocation: (location: string, language = 'en') =>
    apiClient
      .get('/resources', { params: { location, language } })
      .then(r => r.data),

  getAll: () =>
    apiClient.get('/resources').then(r => r.data),

  create: (data: Partial<ResourceService>) =>
    apiClient.post('/resources', data).then(r => r.data),

  update: (id: string, data: Partial<ResourceService>) =>
    apiClient.put(`/resources/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/resources/${id}`).then(r => r.data),
}

// ── counsellorsApi ────────────────────────────────────────────────────────────
export const counsellorsApi = {
  // Survivor-facing
  getAll: () =>
    apiClient.get('/counsellors/').then(r => r.data),

  requestCounsellor: (data: { counsellor_id: string; session_id: string; message?: string }) =>
    apiClient.post('/counsellors/request', data).then(r => r.data),

  // Admin-facing
  getAllCounsellors: () =>
    apiClient.get('/counsellors/admin/counsellors').then(r => r.data),

  createCounsellor: (data: Partial<Counsellor>) =>
    apiClient.post('/counsellors/admin/counsellors', data).then(r => r.data),

  deleteCounsellor: (id: string) =>
    apiClient.delete(`/counsellors/admin/counsellors/${id}`).then(r => r.data),

  getAllRequests: () =>
    apiClient.get('/counsellors/admin/requests').then(r => r.data),

  updateRequestStatus: (id: string, status: 'accepted' | 'declined') =>
    apiClient.patch(`/counsellors/admin/requests/${id}`, { status }).then(r => r.data),
}


// ─────────────────────────────────────────────────────────────────────────────
//  REACT QUERY HOOKS  (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────

/** POST /assess — run risk assessment */
export function useRiskAssessment() {
  return useMutation<RiskAssessmentResult, AxiosError, { text: string; session_token?: string }>({
    mutationFn: payload =>
      apiClient.post('/assess', payload).then(r => r.data),
  })
}

/** POST /resources/match — get location-based services */
export function useResourceMatch() {
  return useMutation<ResourceService[], AxiosError, {
    latitude: number
    longitude: number
    service_types?: string[]
    assessment_id?: string
    limit?: number
  }>({
    mutationFn: payload =>
      apiClient.post('/resources/match', payload).then(r => r.data),
  })
}

/** GET /messages/:caseId — message history */
export function useMessages(caseId: string | null) {
  return useQuery<Message[]>({
    queryKey: ['messages', caseId],
    queryFn: () =>
      apiClient.get(`/messages/${caseId}`).then(r => r.data),
    enabled: !!caseId,
    refetchInterval: false,
    staleTime: 30_000,
  })
}

/** GET /cases — counselor/admin case list */
export function useCases() {
  return useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: () => apiClient.get('/cases').then(r => r.data),
    refetchInterval: 30_000,
  })
}

/** GET /admin/alerts — unacknowledged alerts */
export function useAlerts() {
  return useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: () => apiClient.get('/admin/alerts').then(r => r.data),
    refetchInterval: 15_000,
  })
}

/** POST /admin/alerts/:id/acknowledge */
export function useAcknowledgeAlert() {
  const qc = useQueryClient()
  return useMutation<void, AxiosError, string>({
    mutationFn: alertId =>
      apiClient.post(`/admin/alerts/${alertId}/acknowledge`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })
}

/** GET /resources/services */
export function useServices(county?: string, serviceType?: string) {
  return useQuery<ResourceService[]>({
    queryKey: ['services', county, serviceType],
    queryFn: () =>
      apiClient.get('/resources/services', {
        params: { county, service_type: serviceType },
      }).then(r => r.data),
    staleTime: 5 * 60_000,
  })
}

/** GET /admin/analytics */
export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: () => apiClient.get('/admin/analytics').then(r => r.data),
    staleTime: 60_000,
  })
}