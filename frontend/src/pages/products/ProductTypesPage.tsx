import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/shared/Badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Modal } from '@/components/shared/Modal'
import { productTypesApi } from '@/api/productTypes'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/lib/utils'
import type { ProductType } from '@/types'

function ProductTypeFormModal({ open, onClose, item }: { open: boolean; onClose: () => void; item?: ProductType }) {
  const qc = useQueryClient()
  const isEdit = !!item
  const [form, setForm] = useState({ code: item?.code ?? '', name: item?.name ?? '', description: item?.description ?? '', isActive: item?.isActive ?? true })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => isEdit
      ? productTypesApi.updateProductType(item!.id, { name: form.name, description: form.description || undefined, isActive: form.isActive })
      : productTypesApi.createProductType({ code: form.code, name: form.name, description: form.description || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-types'] }); onClose() },
    onError: (err: any) => setError(err.response?.data?.error ?? 'Failed to save.'),
  })

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Product Type' : 'Add Product Type'}>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
          <input value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))} required disabled={isEdit} placeholder="e.g. SAUCE" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Sauce Pan" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={inputCls} />
        </div>
        {isEdit && (
          <div className="flex items-center gap-3">
            <input type="checkbox" id="ptActive" checked={form.isActive} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 text-brand-600 rounded" />
            <label htmlFor="ptActive" className="text-sm font-medium text-gray-700">Active</label>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50">
            {mutation.isPending ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function ProductTypesPage() {
  const { hasRole } = useAuthStore()
  const qc = useQueryClient()
  const canEdit = hasRole('Administrator')
  const [search, setSearch] = useState('')
  const [page] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<ProductType | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['product-types', search, page],
    queryFn: () => productTypesApi.getProductTypes({ search: search || undefined, page, pageSize: 25 }),
  })

  const deleteMutation = useMutation({
    mutationFn: productTypesApi.deleteProductType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-types'] }),
  })

  return (
    <div>
      <PageHeader
        title="Product Types"
        description="Manage product categories (Sauce Pan, Kadai, Fry Pan, etc.)"
        action={canEdit ? (
          <button onClick={() => { setEditItem(undefined); setModalOpen(true) }}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
            <Plus size={16} /> Add Type
          </button>
        ) : undefined}
      />

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product types…"
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              {canEdit && <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">
                {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
              </tr>
            ))}
            {!isLoading && data?.data.length === 0 && (
              <tr><td colSpan={6}><EmptyState message="No product types found." /></td></tr>
            )}
            {!isLoading && data?.data.map((pt) => (
              <tr key={pt.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-700">{pt.code}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{pt.name}</td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{pt.description ?? '—'}</td>
                <td className="px-4 py-3"><Badge variant={pt.isActive ? 'success' : 'neutral'}>{pt.isActive ? 'Active' : 'Inactive'}</Badge></td>
                <td className="px-4 py-3 text-gray-500">{formatDate(pt.createdAt)}</td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditItem(pt); setModalOpen(true) }} className="text-gray-400 hover:text-brand-600"><Pencil size={15} /></button>
                      <button onClick={() => { if (confirm(`Deactivate "${pt.name}"?`)) deleteMutation.mutate(pt.id) }} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProductTypeFormModal open={modalOpen} onClose={() => setModalOpen(false)} item={editItem} />
    </div>
  )
}
