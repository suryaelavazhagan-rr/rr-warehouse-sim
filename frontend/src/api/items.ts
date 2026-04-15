import { api } from './client'

export interface Item {
  id: string
  name: string
  sku: string
  description?: string
  created_at: string
  updated_at: string
}

export const itemsApi = {
  list: () => api.get<Item[]>('/items').then(r => r.data),
  get: (id: string) => api.get<Item>(`/items/${id}`).then(r => r.data),
  create: (data: { name: string; sku: string; description?: string }) =>
    api.post<Item>('/items', data).then(r => r.data),
  update: (id: string, data: Partial<Pick<Item, 'name' | 'sku' | 'description'>>) =>
    api.put<Item>(`/items/${id}`, data).then(r => r.data),
}
