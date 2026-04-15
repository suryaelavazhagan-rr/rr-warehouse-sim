import { useEffect, useState } from 'react'

export interface OrderEvent {
  order_id: string
  order_line_id?: string
  task_id?: string
  event_type: string
  detail: string
  timestamp: string
}

export function useOrderSSE(orderId: string) {
  const [events, setEvents] = useState<OrderEvent[]>([])

  useEffect(() => {
    if (!orderId) return
    const source = new EventSource(`/api/orders/${orderId}/events`)

    source.onmessage = (e) => {
      const event: OrderEvent = JSON.parse(e.data)
      setEvents(prev => [...prev, event])
    }

    source.onerror = () => source.close()

    return () => source.close()
  }, [orderId])

  return events
}
