import { api } from './client'

export interface OrderLine {
  id: string
  order_id: string
  item_id: string
  requested_qty: number
  fulfilled_qty: number
  status: string
}

export interface Order {
  id: string
  name: string
  status: string
  shortfall_mode: string
  created_at: string
  updated_at: string
  lines?: OrderLine[]
}

export const ordersApi = {
  list: () => api.get<Order[]>('/orders').then(r => r.data),
  get: (id: string) => api.get<Order>(`/orders/${id}`).then(r => r.data),
  create: (data: { name: string; lines: { item_id: string; requested_qty: number }[] }) =>
    api.post<Order>('/orders', data).then(r => r.data),
  cancel: (id: string) => api.put<Order>(`/orders/${id}/cancel`).then(r => r.data),
}
