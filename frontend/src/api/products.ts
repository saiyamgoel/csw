import { client } from './client'
import type { PagedResult } from '@/types'

export interface Product {
  id: string; productTypeId: string; productTypeName: string
  name: string; description: string | null; isActive: boolean; createdAt: string; variantCount: number
}

export interface VariantCharacteristic {
  characteristicTypeId: string; characteristicTypeName: string
  characteristicValueId: string; characteristicValueCode: string; characteristicValueName: string
}

export interface ProductVariant {
  id: string; productId: string; productName: string; variantCode: string; name: string
  unitId: string; unitName: string; sellingPrice: number | null; isActive: boolean; notes: string | null
  createdAt: string; characteristics: VariantCharacteristic[]; hasBom: boolean
}

export const productsApi = {
  getAll: (params?: { productTypeId?: string; page?: number; pageSize?: number }) =>
    client.get<PagedResult<Product>>('/products', { params }).then(r => r.data),

  getById: (id: string) => client.get<Product>(`/products/${id}`).then(r => r.data),

  create: (req: { productTypeId: string; name: string; description?: string }) =>
    client.post<Product>('/products', req).then(r => r.data),

  update: (id: string, req: { name: string; description?: string; isActive: boolean }) =>
    client.put<Product>(`/products/${id}`, req).then(r => r.data),

  getVariants: (productId: string, activeOnly = false) =>
    client.get<ProductVariant[]>(`/products/${productId}/variants`, { params: { activeOnly } }).then(r => r.data),

  getAllVariants: (productId?: string) =>
    client.get<ProductVariant[]>('/products/variants', { params: { productId } }).then(r => r.data),

  getVariantById: (id: string) =>
    client.get<ProductVariant>(`/products/variants/${id}`).then(r => r.data),

  createVariant: (req: { productId: string; name: string; unitId: string; sellingPrice?: number; notes?: string; characteristics: Record<string, string> }) =>
    client.post<ProductVariant>('/products/variants', req).then(r => r.data),

  updateVariant: (id: string, req: { name: string; unitId: string; sellingPrice?: number; notes?: string; isActive: boolean }) =>
    client.put<ProductVariant>(`/products/variants/${id}`, req).then(r => r.data),
}
