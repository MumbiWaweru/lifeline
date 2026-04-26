// hooks/useSocket.ts
// Socket.io client hook — real-time messaging and threat alerts

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:8000'

interface SocketMessage {
  id: string
  case_id: string
  sender_id: string
  sender_role: 'survivor' | 'counselor' | 'admin'
  content: string
  auto_destruct_at: string | null
  created_at: string
}

interface ThreatAlert {
  case_id: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  risk_score: number
  message: string
}

interface UseSocketOptions {
  token: string | null
  caseId: string | null
  onMessage?: (msg: SocketMessage) => void
  onThreatAlert?: (alert: ThreatAlert) => void
}

export function useSocket({ token, caseId, onMessage, onThreatAlert }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token || !caseId) return

    const socket = io(SOCKET_URL, {
      auth: { token, case_id: caseId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[Socket] Connected to LIFELINE real-time server')
    })

    socket.on('message', (msg: SocketMessage) => {
      // Invalidate message history cache so React Query refetches
      queryClient.invalidateQueries({ queryKey: ['messages', caseId] })
      onMessage?.(msg)
    })

    socket.on('threat_alert', (alert: ThreatAlert) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      onThreatAlert?.(alert)
    })

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message)
    })

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [token, caseId]) // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(
    (content: string, autoDestructMinutes?: number) => {
      if (!socketRef.current?.connected || !caseId) return

      socketRef.current.emit('send_message', {
        case_id: caseId,
        content,
        auto_destruct_minutes: autoDestructMinutes ?? null,
      })
    },
    [caseId]
  )

  const markRead = useCallback(() => {
    if (!socketRef.current?.connected || !caseId) return
    socketRef.current.emit('mark_read', { case_id: caseId })
  }, [caseId])

  const isConnected = () => socketRef.current?.connected ?? false

  return { sendMessage, markRead, isConnected }
}