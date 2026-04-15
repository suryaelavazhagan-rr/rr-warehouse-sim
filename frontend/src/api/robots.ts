import { api } from './client'

export interface RobotData {
  id: string
  name: string
  battery_level: number
  status: string
  current_task_id?: string
  created_at: string
}

export const robotsApi = {
  list: () => api.get<RobotData[]>('/robots').then(r => r.data),
  get: (id: string) => api.get<RobotData>(`/robots/${id}`).then(r => r.data),
  charge: (id: string) => api.put<RobotData>(`/robots/${id}/charge`).then(r => r.data),
  reset: (id: string) => api.put<RobotData>(`/robots/${id}/reset`).then(r => r.data),
}
