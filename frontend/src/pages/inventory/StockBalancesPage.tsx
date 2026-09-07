import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/PageHeader'
import { StockBadge } from '@/components/shared/Badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { inventoryApi } from '@/api/inventory'
import { formatNumber } from '@/lib/utils'

export function StockBalancesPage() {
  const [lowOnly, setLowOnly] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['balances', lowOnly],
    queryFn: () => inventoryApi.getBalances(lowOnly),
  })

  return (
    <div>
      <PageHeader title="Current Stock" description="Live inventory balances across all items" />

      <div className="flex gap-3 mb-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={lowOnly} onChange={e => setLowOnly(e.target.checked)} />
          Show low / out-of-stock only
        </label>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">On Hand</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Min Level</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Unit</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                ))}
              </tr>
            ))}
            {!isLoading && data?.length === 0 && (
              <tr><td colSpan={7}><EmptyState message="No items match the current filter." /></td></tr>
            )}
            {!isLoading && data?.map(b => (
              <tr key={b.itemId} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.itemCode}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{b.itemName}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{b.category.replace('_', ' ').toLowerCase()}</td>
                <td className={`px-4 py-3 text-right font-semibold ${b.quantityOnHand <= 0 ? 'text-red-600' : b.quantityOnHand <= b.minimumStockLevel ? 'text-amber-600' : 'text-gray-900'}`}>
                  {formatNumber(b.quantityOnHand)}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">{formatNumber(b.minimumStockLevel)}</td>
                <td className="px-4 py-3 text-gray-500">{b.unitAbbreviation}</td>
                <td className="px-4 py-3"><StockBadge status={b.stockStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
