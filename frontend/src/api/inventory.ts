import { client } from './client'
import type { InventoryBalance, InventoryTransaction, PagedResult } from '@/types'

export const inventoryApi = {
  getBalances: (lowStockOnly?: boolean) =>
    client.get<InventoryBalance[]>('/inventory/balances', { params: { lowStockOnly } }).then(r => r.data),

  getLedger: (params?: {
    itemId?: string; transactionType?: string;
    from?: string; to?: string; page?: number; pageSize?: number;
  }) =>
    client.get<PagedResult<InventoryTransaction>>('/inventory/transactions', { params }).then(r => r.data),

  postReceipt: (req: { itemId: string; quantity: number; reference?: string; notes?: string; transactionDate: string }) =>
    client.post<InventoryTransaction>('/inventory/transactions/receipt', req).then(r => r.data),

  postConsumption: (req: { itemId: string; quantity: number; reference?: string; notes?: string; transactionDate: string }) =>
    client.post<InventoryTransaction>('/inventory/transactions/consumption', req).then(r => r.data),

  postAdjustment: (req: { itemId: string; quantity: number; isPositive: boolean; reference?: string; notes?: string; transactionDate: string }) =>
    client.post<InventoryTransaction>('/inventory/transactions/adjustment', req).then(r => r.data),

  postOpeningBalance: (req: { itemId: string; quantity: number; notes?: string }) =>
    client.post<InventoryTransaction>('/inventory/transactions/opening-balance', req).then(r => r.data),

  voidTransaction: (id: string) =>
    client.post<InventoryTransaction>(`/inventory/transactions/${id}/void`).then(r => r.data),
}
