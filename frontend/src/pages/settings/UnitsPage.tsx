import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Modal } from '@/components/shared/Modal'
import { itemsApi } from '@/api/items'
import type { Unit } from '@/types'

function UnitFormModal({ open, onClose, unit }: { open: boolean; onClose: () => void; unit?: Unit }) {
  const qc = useQueryClient()
  const isEdit = !!unit
  const [form, setForm] = useState({
    name: unit?.name ?? '',
    abbreviation: unit?.abbreviation ?? '',
    isActive: (unit as any)?.isActive ?? true,
  })

  const mutation = useMutation({
    mutationFn: () => isEdit
      ? itemsApi.updateUnit(unit!.id, form)
      : itemsApi.createUnit({ name: form.name, abbreviation: form.abbreviation }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['units-all'] }); onClose() },
  })

  return (
    <Modal open={open} title={isEdit ? 'Edit Unit' : 'Add Unit'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Abbreviation *</label>
          <input value={form.abbreviation} onChange={e => setForm(f => ({ ...f, abbreviation: e.target.value.toUpperCase() }))}
            maxLength={10}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono" />
        </div>
        {isEdit && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            Active
          </label>
        )}
        {mutation.isError && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.name || !form.abbreviation || mutation.isPending}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function UnitsPage() {
  const [modal, setModal] = useState(false)
  const [editUnit, setEditUnit] = useState<Unit | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['units-all'],
    queryFn: () => itemsApi.getUnits(true),
  })

  const openCreate = () => { setEditUnit(undefined); setModal(true) }
  const openEdit = (u: Unit) => { setEditUnit(u); setModal(true) }

  return (
    <div>
      <PageHeader
        title="Units of Measure"
        description="Manage units used across items"
        action={
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
            <Plus size={16} /> Add Unit
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-w-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Abbreviation</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">
                {Array.from({ length: 4 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                ))}
              </tr>
            ))}
            {!isLoading && (data as any[])?.map((u: any) => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 font-mono text-gray-600">{u.abbreviation}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(u)} className="text-gray-400 hover:text-brand-600"><Pencil size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <UnitFormModal open={modal} onClose={() => setModal(false)} unit={editUnit} />
    </div>
  )
}
