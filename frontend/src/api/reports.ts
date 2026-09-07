import { client } from './client'
import type { PagedResult } from '@/types'

export interface CurrentInventoryRow {
  itemCode: string; itemName: string; category: string
  unitName: string; unitAbbreviation: string
  quantityOnHand: number; minimumStockLevel: number; reorderLevel: number; stockStatus: string
}

export interface LowStockRow {
  itemCode: string; itemName: string; category: string; unitAbbreviation: string
  quantityOnHand: number; minimumStockLevel: number; shortage: number
}

export interface StockMovementRow {
  transactionDate: string; itemCode: string; itemName: string
  transactionType: string; sign: number; quantity: number
  reference: string | null; postedByName: string
}

export interface AuditEventRow {
  id: number; eventTime: string; username: string | null
  action: string; entityType: string | null; entityId: string | null
  details: string | null; status: string
}

export const reportsApi = {
  getCurrentInventory: (category?: string) =>
    client.get<CurrentInventoryRow[]>('/reports/current-inventory', { params: { category } }).then(r => r.data),

  getLowStock: () =>
    client.get<LowStockRow[]>('/reports/low-stock').then(r => r.data),

  getStockMovement: (from?: string, to?: string, itemId?: string) =>
    client.get<StockMovementRow[]>('/reports/stock-movement', { params: { from, to, itemId } }).then(r => r.data),

  getAuditLog: (params?: { action?: string; username?: string; from?: string; to?: string; page?: number; pageSize?: number }) =>
    client.get<PagedResult<AuditEventRow>>('/audit/events', { params }).then(r => r.data),
}
