import { apiClient } from './client'
import type { PagedResult, ProductType, ProductTypeCreateRequest, ProductTypeUpdateRequest } from '@/types'

export const productTypesApi = {
  getProductTypes: (params: { search?: string; page?: number; pageSize?: number }) =>
    apiClient.get<PagedResult<ProductType>>('/product-types', { params }).then((r) => r.data),

  createProductType: (data: ProductTypeCreateRequest) =>
    apiClient.post<ProductType>('/product-types', data).then((r) => r.data),

  updateProductType: (id: string, data: ProductTypeUpdateRequest) =>
    apiClient.put<ProductType>(`/product-types/${id}`, data).then((r) => r.data),

  deleteProductType: (id: string) =>
    apiClient.delete(`/product-types/${id}`),
}
