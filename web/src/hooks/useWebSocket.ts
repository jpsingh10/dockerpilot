import { useEffect, useRef, useCallback, useState } from 'react'

export interface WSMessage {
  type: 'log' | 'metric' | 'event' | 'error'
  payload: any
  timestamp: string
}

export function useContainerWebSocket(containerID: string | null) {
  const wsRef = useRef<WebSocket | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [metrics, setMetrics] = useState<any[]>([])
  const [connected, setConnected] = useState(false)

  const connect = useCallback(() => {
    if (!containerID) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/${containerID}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => {
      setConnected(false)
      setTimeout(() => connect(), 3000)
    }
    ws.onerror = () => ws.close()

    ws.onmessage = (event) => {
      const msg: WSMessage = JSON.parse(event.data)
      switch (msg.type) {
        case 'log':
          setLogs(prev => {
            const next = [...prev, msg.payload as string]
            return next.length > 1000 ? next.slice(-500) : next
          })
          break
        case 'metric':
          setMetrics(prev => {
            const next = [...prev, { ...msg.payload, timestamp: msg.timestamp }]
            return next.length > 120 ? next.slice(-60) : next
          })
          break
      }
    }
  }, [containerID])

  useEffect(() => {
    connect()
    return () => { wsRef.current?.close() }
  }, [connect])

  const clearLogs = useCallback(() => setLogs([]), [])

  return { logs, metrics, connected, clearLogs }
}
