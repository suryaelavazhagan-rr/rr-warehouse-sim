import { api } from './client'

export interface TaskData {
  id: string
  order_id: string
  order_line_id: string
  item_id: string
  quantity: number
  assigned_robot_id?: string
  status: string
  created_at: string
  updated_at: string
}

export const tasksApi = {
  list: () => api.get<TaskData[]>('/tasks').then(r => r.data),
  get: (id: string) => api.get<TaskData>(`/tasks/${id}`).then(r => r.data),
}
