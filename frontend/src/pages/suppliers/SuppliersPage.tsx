import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { Modal } from '@/components/shared/Modal'
import { suppliersApi } from '@/api/suppliers'
import { useAuthStore } from '@/store/authStore'
import type { Supplier } from '@/types'

function SupplierFormModal({ open, onClose, supplier }: { open: boolean; onClose: () => void; supplier?: Supplier }) {
  const qc = useQueryClient()
  const isEdit = !!supplier
  const [form, setForm] = useState({
    name: supplier?.name ?? '',
    contactName: supplier?.contactName ?? '',
    phone: supplier?.phone ?? '',
    email: supplier?.email ?? '',
    notes: supplier?.notes ?? '',
    isActive: supplier?.isActive ?? true,
  })

  const mutation = useMutation({
    mutationFn: () => isEdit
      ? suppliersApi.update(supplier!.id, { ...form, isActive: form.isActive })
      : suppliersApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); onClose() },
  })

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal open={open} title={isEdit ? 'Edit Supplier' : 'Add Supplier'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
            <input value={form.contactName} onChange={e => set('contactName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        {isEdit && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
            Active
          </label>
        )}
        {mutation.isError && (
          <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.name || mutation.isPending}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function SuppliersPage() {
  const { hasRole } = useAuthStore()
  const qc = useQueryClient()
  const canEdit = hasRole('Administrator')

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState<Supplier | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', debouncedSearch, page],
    queryFn: () => suppliersApi.getAll({ search: debouncedSearch || undefined, page, pageSize: 25 }),
  })

  const deactivateMutation = useMutation({
    mutationFn: suppliersApi.deactivate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })

  const handleSearch = (v: string) => {
    setSearch(v)
    clearTimeout((window as any).__st)
    ;(window as any).__st = setTimeout(() => { setDebouncedSearch(v); setPage(1) }, 300)
  }

  const openCreate = () => { setEditItem(undefined); setModal(true) }
  const openEdit = (s: Supplier) => { setEditItem(s); setModal(true) }

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Manage your approved supplier list"
        action={canEdit ? (
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
            <Plus size={16} /> Add Supplier
          </button>
        ) : undefined}
      />

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => handleSearch(e.target.value)}
          placeholder="Search suppliers…"
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              {canEdit && <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">
                {Array.from({ length: canEdit ? 6 : 5 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                ))}
              </tr>
            ))}
            {!isLoading && data?.data.length === 0 && (
              <tr><td colSpan={canEdit ? 6 : 5}><EmptyState message="No suppliers found." /></td></tr>
            )}
            {!isLoading && data?.data.map(s => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-3 text-gray-600">{s.contactName ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{s.phone ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{s.email ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="text-gray-400 hover:text-brand-600"><Pencil size={15} /></button>
                      <button onClick={() => confirm(`Deactivate "${s.name}"?`) && deactivateMutation.mutate(s.id)}
                        className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={page} pageSize={25} total={data.total} onChange={setPage} />}
      <SupplierFormModal open={modal} onClose={() => setModal(false)} supplier={editItem} />
    </div>
  )
}
