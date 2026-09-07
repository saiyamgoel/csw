import { client } from './client'
import type { Supplier, SupplierCreateRequest, SupplierUpdateRequest, PagedResult } from '@/types'

export const suppliersApi = {
  getAll: (params?: { search?: string; activeOnly?: boolean; page?: number; pageSize?: number }) =>
    client.get<PagedResult<Supplier>>('/suppliers', { params }).then(r => r.data),

  getById: (id: string) =>
    client.get<Supplier>(`/suppliers/${id}`).then(r => r.data),

  create: (req: SupplierCreateRequest) =>
    client.post<Supplier>('/suppliers', req).then(r => r.data),

  update: (id: string, req: SupplierUpdateRequest) =>
    client.put<Supplier>(`/suppliers/${id}`, req).then(r => r.data),

  deactivate: (id: string) =>
    client.delete(`/suppliers/${id}`),
}
