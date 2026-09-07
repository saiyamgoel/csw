import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ban } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { inventoryApi } from '@/api/inventory'
import { itemsApi } from '@/api/items'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/lib/utils'

const TYPE_OPTIONS = ['', 'Receipt', 'Consumption', 'Positive Adjustment', 'Negative Adjustment', 'Opening Balance']

function txTypeColor(type: string, sign: number) {
  if (sign > 0) return 'text-green-700'
  if (sign < 0) return 'text-red-700'
  return 'text-gray-600'
}

export function StockLedgerPage() {
  const { hasRole } = useAuthStore()
  const qc = useQueryClient()
  const canVoid = hasRole('Administrator')

  const [itemId, setItemId] = useState('')
  const [txType, setTxType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const { data: items } = useQuery({ queryKey: ['items-all'], queryFn: () => itemsApi.getItems({ pageSize: 999 }) })
  const { data, isLoading } = useQuery({
    queryKey: ['ledger', itemId, txType, from, to, page],
    queryFn: () => inventoryApi.getLedger({
      itemId: itemId || undefined,
      transactionType: txType || undefined,
      from: from || undefined,
      to: to || undefined,
      page, pageSize: 50,
    }),
  })

  const voidMutation = useMutation({
    mutationFn: inventoryApi.voidTransaction,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ledger'] }); qc.invalidateQueries({ queryKey: ['balances'] }) },
  })

  return (
    <div>
      <PageHeader title="Stock Ledger" description="Full immutable transaction history" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={itemId} onChange={e => { setItemId(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All Items</option>
          {items?.data.map(i => <option key={i.id} value={i.id}>{i.code} – {i.name}</option>)}
        </select>
        <select value={txType} onChange={e => { setTxType(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t || 'All Types'}</option>)}
        </select>
        <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <button onClick={() => { setItemId(''); setTxType(''); setFrom(''); setTo(''); setPage(1) }}
          className="text-sm text-gray-500 hover:text-gray-900 px-2">Clear</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Qty</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Reference</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Posted By</th>
              {canVoid && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">
                {Array.from({ length: canVoid ? 7 : 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                ))}
              </tr>
            ))}
            {!isLoading && data?.data.length === 0 && (
              <tr><td colSpan={canVoid ? 7 : 6}><EmptyState message="No transactions found." /></td></tr>
            )}
            {!isLoading && data?.data.map(tx => (
              <tr key={tx.id} className={`border-b border-gray-50 hover:bg-gray-50 ${tx.isVoided ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(tx.transactionDate)}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-gray-500">{tx.itemCode}</span>
                  <span className="ml-2 text-gray-900">{tx.itemName}</span>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {tx.isVoided ? <span className="line-through text-gray-400">{tx.transactionType}</span> : tx.transactionType}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${txTypeColor(tx.transactionType, tx.sign)}`}>
                  {tx.sign > 0 ? '+' : '−'}{tx.quantity.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-gray-500">{tx.reference ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{tx.postedByName}</td>
                {canVoid && (
                  <td className="px-4 py-3 text-right">
                    {!tx.isVoided && (
                      <button
                        onClick={() => confirm('Void this transaction? A reversal entry will be created.') && voidMutation.mutate(tx.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors" title="Void">
                        <Ban size={15} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pagination page={page} pageSize={50} total={data.total} onChange={setPage} />}
    </div>
  )
}
