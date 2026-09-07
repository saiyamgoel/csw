import { client } from './client'
import type { Item, ItemCreateRequest, ItemUpdateRequest, PagedResult, Unit } from '@/types'

export const itemsApi = {
  getUnits: (all = false) =>
    client.get<Unit[]>('/units', { params: all ? { all: true } : undefined }).then(r => r.data),

  createUnit: (data: { name: string; abbreviation: string }) =>
    client.post<Unit>('/units', data).then(r => r.data),

  updateUnit: (id: string, data: { name: string; abbreviation: string; isActive: boolean }) =>
    client.put<Unit>(`/units/${id}`, data).then(r => r.data),

  getItems: (params: { category?: string; search?: string; page?: number; pageSize?: number }) =>
    client.get<PagedResult<Item>>('/items', { params }).then(r => r.data),

  getItem: (id: string) =>
    client.get<Item>(`/items/${id}`).then(r => r.data),

  createItem: (data: ItemCreateRequest) =>
    client.post<Item>('/items', data).then(r => r.data),

  updateItem: (id: string, data: ItemUpdateRequest) =>
    client.put<Item>(`/items/${id}`, data).then(r => r.data),

  deleteItem: (id: string) =>
    client.delete(`/items/${id}`),
}
