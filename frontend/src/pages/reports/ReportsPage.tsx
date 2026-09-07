import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StockBadge } from '@/components/shared/Badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { reportsApi } from '@/api/reports'
import { itemsApi } from '@/api/items'
import { downloadCsv } from '@/lib/csv'
import { formatNumber, formatDate } from '@/lib/utils'

type Tab = 'current-inventory' | 'low-stock' | 'stock-movement'

const TABS: { id: Tab; label: string }[] = [
  { id: 'current-inventory', label: 'Current Inventory' },
  { id: 'low-stock', label: 'Low Stock' },
  { id: 'stock-movement', label: 'Stock Movement' },
]

function CurrentInventoryTab() {
  const [category, setCategory] = useState('')
  const { data = [], isLoading } = useQuery({
    queryKey: ['report-current-inventory', category],
    queryFn: () => reportsApi.getCurrentInventory(category || undefined),
  })

  return (
    <div>
      <div className="flex gap-3 mb-4 items-center">
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All Categories</option>
          <option value="RAW_MATERIAL">Raw Materials</option>
          <option value="ACCESSORY">Accessories</option>
          <option value="PACKAGING">Packaging</option>
        </select>
        <button onClick={() => downloadCsv(data.map(r => ({
          'Item Code': r.itemCode, 'Item Name': r.itemName, 'Category': r.category,
          'Unit': r.unitAbbreviation, 'On Hand': r.quantityOnHand,
          'Min Level': r.minimumStockLevel, 'Reorder Level': r.reorderLevel, 'Status': r.stockStatus
        })), `current-inventory-${new Date().toISOString().slice(0,10)}.csv`)}
          disabled={!data.length}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
          <Download size={14} /> Export CSV
        </button>
        <span className="text-sm text-gray-500 ml-auto">{data.length} items</span>
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
            {isLoading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">
                {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
              </tr>
            ))}
            {!isLoading && data.length === 0 && <tr><td colSpan={7}><EmptyState message="No items found." /></td></tr>}
            {!isLoading && data.map(r => (
              <tr key={r.itemCode} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.itemCode}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{r.itemName}</td>
                <td className="px-4 py-3 text-gray-500">{r.category}</td>
                <td className={`px-4 py-3 text-right font-semibold ${r.quantityOnHand <= 0 ? 'text-red-600' : r.stockStatus === 'LOW_STOCK' ? 'text-amber-600' : 'text-gray-900'}`}>
                  {formatNumber(r.quantityOnHand)}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">{formatNumber(r.minimumStockLevel)}</td>
                <td className="px-4 py-3 text-gray-500">{r.unitAbbreviation}</td>
                <td className="px-4 py-3"><StockBadge status={r.stockStatus as any} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LowStockTab() {
  const { data = [], isLoading } = useQuery({ queryKey: ['report-low-stock'], queryFn: reportsApi.getLowStock })

  return (
    <div>
      <div className="flex gap-3 mb-4 items-center">
        <button onClick={() => downloadCsv(data.map(r => ({
          'Item Code': r.itemCode, 'Item Name': r.itemName, 'Category': r.category,
          'Unit': r.unitAbbreviation, 'On Hand': r.quantityOnHand,
          'Min Level': r.minimumStockLevel, 'Shortage': r.shortage
        })), `low-stock-${new Date().toISOString().slice(0,10)}.csv`)}
          disabled={!data.length}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
          <Download size={14} /> Export CSV
        </button>
        <span className="text-sm text-gray-500 ml-auto">{data.length} items need attention</span>
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
              <th className="text-right px-4 py-3 font-medium text-gray-600 text-red-700">Shortage</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Unit</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
            ))}
            {!isLoading && data.length === 0 && <tr><td colSpan={7}><EmptyState message="All items are adequately stocked." /></td></tr>}
            {!isLoading && data.map(r => (
              <tr key={r.itemCode} className="border-b border-gray-50 hover:bg-amber-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.itemCode}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{r.itemName}</td>
                <td className="px-4 py-3 text-gray-500">{r.category}</td>
                <td className={`px-4 py-3 text-right font-semibold ${r.quantityOnHand <= 0 ? 'text-red-600' : 'text-amber-600'}`}>{formatNumber(r.quantityOnHand)}</td>
                <td className="px-4 py-3 text-right text-gray-500">{formatNumber(r.minimumStockLevel)}</td>
                <td className="px-4 py-3 text-right font-semibold text-red-600">{formatNumber(r.shortage)}</td>
                <td className="px-4 py-3 text-gray-500">{r.unitAbbreviation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StockMovementTab() {
  const today = new Date().toISOString().slice(0, 10)
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const [from, setFrom] = useState(monthAgo)
  const [to, setTo] = useState(today)
  const [itemId, setItemId] = useState('')

  const { data: items } = useQuery({ queryKey: ['items-all'], queryFn: () => itemsApi.getItems({ pageSize: 999 }) })
  const { data = [], isLoading } = useQuery({
    queryKey: ['report-stock-movement', from, to, itemId],
    queryFn: () => reportsApi.getStockMovement(from, to, itemId || undefined),
  })

  const receipts = data.filter(r => r.sign > 0).reduce((s, r) => s + r.quantity, 0)
  const consumptions = data.filter(r => r.sign < 0).reduce((s, r) => s + r.quantity, 0)

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <span className="text-gray-400 text-sm">to</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <select value={itemId} onChange={e => setItemId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All Items</option>
          {items?.data.map(i => <option key={i.id} value={i.id}>{i.code} – {i.name}</option>)}
        </select>
        <button onClick={() => downloadCsv(data.map(r => ({
          'Date': r.transactionDate.slice(0,10), 'Item Code': r.itemCode, 'Item Name': r.itemName,
          'Type': r.transactionType, 'Sign': r.sign > 0 ? '+' : '−', 'Quantity': r.quantity,
          'Reference': r.reference ?? '', 'Posted By': r.postedByName
        })), `stock-movement-${from}-to-${to}.csv`)}
          disabled={!data.length}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
          <Download size={14} /> Export CSV
        </button>
      </div>
      {data.length > 0 && (
        <div className="flex gap-4 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm">
            <span className="text-green-700 font-medium">Total In: </span>
            <span className="text-green-800 font-bold">{formatNumber(receipts)}</span>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
            <span className="text-red-700 font-medium">Total Out: </span>
            <span className="text-red-800 font-bold">{formatNumber(consumptions)}</span>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm">
            <span className="text-gray-700 font-medium">Net: </span>
            <span className={`font-bold ${receipts - consumptions >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatNumber(receipts - consumptions)}</span>
          </div>
        </div>
      )}
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
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
            ))}
            {!isLoading && data.length === 0 && <tr><td colSpan={6}><EmptyState message="No transactions in the selected date range." /></td></tr>}
            {!isLoading && data.map((r, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(r.transactionDate)}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-gray-400">{r.itemCode}</span>
                  <span className="ml-2 text-gray-900">{r.itemName}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.transactionType}</td>
                <td className={`px-4 py-3 text-right font-semibold ${r.sign > 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {r.sign > 0 ? '+' : '−'}{formatNumber(r.quantity)}
                </td>
                <td className="px-4 py-3 text-gray-500">{r.reference ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{r.postedByName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('current-inventory')

  return (
    <div>
      <PageHeader title="Reports" description="Inventory reports with CSV export" />
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'current-inventory' && <CurrentInventoryTab />}
      {tab === 'low-stock' && <LowStockTab />}
      {tab === 'stock-movement' && <StockMovementTab />}
    </div>
  )
}
