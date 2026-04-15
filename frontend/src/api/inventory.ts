import { api } from './client'

export interface InventoryRecord {
  id: string
  item_id: string
  quantity: number
  location: string
  updated_at: string
}

export const inventoryApi = {
  list: () => api.get<InventoryRecord[]>('/inventory').then(r => r.data),
  get: (id: string) => api.get<InventoryRecord>(`/inventory/${id}`).then(r => r.data),
  create: (data: { item_id: string; quantity: number; location?: string }) =>
    api.post<InventoryRecord>('/inventory', data).then(r => r.data),
  update: (id: string, data: { quantity?: number; location?: string }) =>
    api.put<InventoryRecord>(`/inventory/${id}`, data).then(r => r.data),
}
