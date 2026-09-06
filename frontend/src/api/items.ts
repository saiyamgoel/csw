import { apiClient } from './client'
import type { Item, ItemCreateRequest, ItemUpdateRequest, PagedResult, Unit } from '@/types'

export const itemsApi = {
  getUnits: () =>
    apiClient.get<Unit[]>('/units').then((r) => r.data),

  getItems: (params: { category?: string; search?: string; page?: number; pageSize?: number }) =>
    apiClient.get<PagedResult<Item>>('/items', { params }).then((r) => r.data),

  getItem: (id: string) =>
    apiClient.get<Item>(`/items/${id}`).then((r) => r.data),

  createItem: (data: ItemCreateRequest) =>
    apiClient.post<Item>('/items', data).then((r) => r.data),

  updateItem: (id: string, data: ItemUpdateRequest) =>
    apiClient.put<Item>(`/items/${id}`, data).then((r) => r.data),

  deleteItem: (id: string) =>
    apiClient.delete(`/items/${id}`),
}
