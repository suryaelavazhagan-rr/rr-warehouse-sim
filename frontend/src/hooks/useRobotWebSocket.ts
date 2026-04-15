import { useEffect, useRef, useState, useCallback } from 'react'

export interface RobotEvent {
  robot_id: string
  robot_name: string
  from_state: string
  to_state: string
  battery_level: number
  task_id?: string
  timestamp: string
}

export function useRobotWebSocket() {
  const [robotStates, setRobotStates] = useState<Record<string, RobotEvent>>({})
  const [allEvents, setAllEvents] = useState<RobotEvent[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws/robots`)

    ws.onopen = () => {
      setConnected(true)
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
    }

    ws.onclose = () => {
      setConnected(false)
      reconnectRef.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => ws.close()

    ws.onmessage = (e) => {
      const event: RobotEvent = JSON.parse(e.data)
      setRobotStates(prev => ({ ...prev, [event.robot_id]: event }))
      setAllEvents(prev => [event, ...prev].slice(0, 500))
    }

    wsRef.current = ws
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { robotStates, allEvents, connected }
}
