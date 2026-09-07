import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { inventoryApi } from '@/api/inventory'
import { itemsApi } from '@/api/items'

type TxMode = 'receipt' | 'consumption' | 'adjustment' | 'opening-balance'

const CONFIG: Record<TxMode, { title: string; description: string; showSign?: boolean; showOpeningNote?: boolean }> = {
  receipt:          { title: 'Post Goods Receipt', description: 'Record incoming stock from supplier or production' },
  consumption:      { title: 'Post Consumption', description: 'Record material used in production' },
  adjustment:       { title: 'Stock Adjustment', description: 'Correct stock after physical count', showSign: true },
  'opening-balance': { title: 'Opening Balance', description: 'Set initial stock for a new item (one-time only)', showOpeningNote: true },
}

export function TransactionEntryPage({ mode }: { mode: TxMode }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const cfg = CONFIG[mode]

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ itemId: '', quantity: '', isPositive: true, reference: '', notes: '', transactionDate: today })
  const [success, setSuccess] = useState(false)

  const { data: items } = useQuery({ queryKey: ['items-all'], queryFn: () => itemsApi.getItems({ pageSize: 999 }) })

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: () => {
      const qty = parseFloat(form.quantity)
      const itemId = form.itemId
      const date = form.transactionDate
      if (mode === 'receipt')
        return inventoryApi.postReceipt({ itemId, quantity: qty, reference: form.reference || undefined, notes: form.notes || undefined, transactionDate: date })
      if (mode === 'consumption')
        return inventoryApi.postConsumption({ itemId, quantity: qty, reference: form.reference || undefined, notes: form.notes || undefined, transactionDate: date })
      if (mode === 'adjustment')
        return inventoryApi.postAdjustment({ itemId, quantity: qty, isPositive: form.isPositive, reference: form.reference || undefined, notes: form.notes || undefined, transactionDate: date })
      return inventoryApi.postOpeningBalance({ itemId, quantity: qty, notes: form.notes || undefined })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['balances'] })
      qc.invalidateQueries({ queryKey: ['ledger'] })
      qc.invalidateQueries({ queryKey: ['items'] })
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
      setSuccess(true)
      setForm({ itemId: '', quantity: '', isPositive: true, reference: '', notes: '', transactionDate: today })
    },
  })

  if (success) return (
    <div>
      <PageHeader title={cfg.title} description={cfg.description} />
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
        <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
        <p className="font-medium text-gray-900 mb-1">Transaction posted successfully</p>
        <div className="flex gap-3 justify-center mt-4">
          <button onClick={() => setSuccess(false)} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">Post Another</button>
          <button onClick={() => navigate('/inventory/ledger')} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">View Ledger</button>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader title={cfg.title} description={cfg.description} />
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
            <select value={form.itemId} onChange={e => set('itemId', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">Select an item…</option>
              {items?.data.filter(i => i.isActive).map(i => (
                <option key={i.id} value={i.id}>{i.code} – {i.name} (Stock: {i.currentStock} {i.unitAbbreviation})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <input type="number" min="0.0001" step="0.01" value={form.quantity} onChange={e => set('quantity', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          {cfg.showSign && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={form.isPositive} onChange={() => set('isPositive', true)} />
                  <span className="text-green-700 font-medium">+ Increase (stock count higher than system)</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={!form.isPositive} onChange={() => set('isPositive', false)} />
                  <span className="text-red-700 font-medium">− Decrease (stock count lower than system)</span>
                </label>
              </div>
            </div>
          )}

          {mode !== 'opening-balance' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date *</label>
              <input type="date" value={form.transactionDate} onChange={e => set('transactionDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          )}

          {mode !== 'opening-balance' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
              <input value={form.reference} onChange={e => set('reference', e.target.value)}
                placeholder={mode === 'receipt' ? 'PO number / GRN' : mode === 'consumption' ? 'Production order' : 'Ref'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          {cfg.showOpeningNote && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Opening balance can only be posted once per item. Use a stock adjustment to correct quantities later.
            </p>
          )}

          {mutation.isError && (
            <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
          )}

          <button
            onClick={() => mutation.mutate()}
            disabled={!form.itemId || !form.quantity || parseFloat(form.quantity) <= 0 || mutation.isPending}
            className="w-full py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
            {mutation.isPending ? 'Posting…' : 'Post Transaction'}
          </button>
        </div>
      </div>
    </div>
  )
}
