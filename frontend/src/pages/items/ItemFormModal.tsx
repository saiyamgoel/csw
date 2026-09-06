import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/shared/Modal'
import { itemsApi } from '@/api/items'
import type { Item, ItemCategory } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  item?: Item
}

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'RAW_MATERIAL', label: 'Raw Material' },
  { value: 'ACCESSORY', label: 'Accessory' },
  { value: 'PACKAGING', label: 'Packaging' },
]

export function ItemFormModal({ open, onClose, item }: Props) {
  const qc = useQueryClient()
  const isEdit = !!item

  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: itemsApi.getUnits })

  const [form, setForm] = useState({
    code: '', name: '', category: 'RAW_MATERIAL' as ItemCategory,
    description: '', unitId: '', minimumStockLevel: 0, reorderLevel: 0, preferredStockLevel: 0,
    isActive: true,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (item) {
      setForm({
        code: item.code, name: item.name, category: item.category,
        description: item.description ?? '', unitId: item.unitId,
        minimumStockLevel: item.minimumStockLevel, reorderLevel: item.reorderLevel,
        preferredStockLevel: item.preferredStockLevel, isActive: item.isActive,
      })
    } else {
      setForm({ code: '', name: '', category: 'RAW_MATERIAL', description: '', unitId: units[0]?.id ?? '', minimumStockLevel: 0, reorderLevel: 0, preferredStockLevel: 0, isActive: true })
    }
    setError('')
  }, [item, open, units])

  const set = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }))

  const mutation = useMutation({
    mutationFn: () =>
      isEdit
        ? itemsApi.updateItem(item!.id, { name: form.name, description: form.description || undefined, unitId: form.unitId, minimumStockLevel: Number(form.minimumStockLevel), reorderLevel: Number(form.reorderLevel), preferredStockLevel: Number(form.preferredStockLevel), isActive: form.isActive })
        : itemsApi.createItem({ code: form.code, name: form.name, category: form.category, description: form.description || undefined, unitId: form.unitId, minimumStockLevel: Number(form.minimumStockLevel), reorderLevel: Number(form.reorderLevel), preferredStockLevel: Number(form.preferredStockLevel) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] })
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
      onClose()
    },
    onError: (err: any) => setError(err.response?.data?.error ?? 'Failed to save item.'),
  })

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Item' : 'Add Inventory Item'} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Item Code *</label>
            <input value={form.code} onChange={(e) => set('code', e.target.value)} required disabled={isEdit} placeholder="e.g. TRI-MAT-001" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Category *</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} disabled={isEdit} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Item Name *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="e.g. Triply Material 3-ply sheet" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Optional description" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Unit of Measurement *</label>
          <select value={form.unitId} onChange={(e) => set('unitId', e.target.value)} required className={inputCls}>
            <option value="">Select unit…</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Minimum Level</label>
            <input type="number" min={0} step={0.01} value={form.minimumStockLevel} onChange={(e) => set('minimumStockLevel', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Reorder Level</label>
            <input type="number" min={0} step={0.01} value={form.reorderLevel} onChange={(e) => set('reorderLevel', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Preferred Level</label>
            <input type="number" min={0} step={0.01} value={form.preferredStockLevel} onChange={(e) => set('preferredStockLevel', e.target.value)} className={inputCls} />
          </div>
        </div>

        {isEdit && (
          <div className="flex items-center gap-3">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="w-4 h-4 text-brand-600 rounded" />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50">
            {mutation.isPending ? 'Saving…' : isEdit ? 'Update Item' : 'Create Item'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
