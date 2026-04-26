// api/index.ts
// Centralised API client with React Query hooks, JWT management, auto-expiry.

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
  const token = localStorage.getItem('token')
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
      window.location.href = '/login'
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
  explanation: Record<string, number>  // phrase → score
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


// ─── Auth helpers ──────────────────────────────────────────────────────────────
export const getToken   = () => localStorage.getItem('token')
export const getRole    = () => localStorage.getItem('role') as UserRole | null
export const isLoggedIn = () => !!getToken()

export function logout() {
  apiClient.post('/auth/logout').finally(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    window.location.href = '/login'
  })
}


// ─── React Query hooks ─────────────────────────────────────────────────────────

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
    refetchInterval: false,  // Real-time via Socket.io; manual refetch on new message
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