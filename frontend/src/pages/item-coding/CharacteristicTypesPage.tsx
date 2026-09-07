import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ChevronRight, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Modal } from '@/components/shared/Modal'
import { EmptyState } from '@/components/shared/EmptyState'
import { characteristicTypesApi, type CharacteristicType, type CharacteristicValue } from '@/api/characteristicTypes'

function ValueFormModal({ open, onClose, typeId, value }: {
  open: boolean; onClose: () => void; typeId: string; value?: CharacteristicValue
}) {
  const qc = useQueryClient()
  const isEdit = !!value
  const [form, setForm] = useState({ code: value?.code ?? '', name: value?.name ?? '', sortOrder: value?.sortOrder ?? 0, isActive: value?.isActive ?? true })
  const mutation = useMutation({
    mutationFn: () => isEdit
      ? characteristicTypesApi.updateValue(value!.id, { name: form.name, sortOrder: form.sortOrder, isActive: form.isActive })
      : characteristicTypesApi.addValue(typeId, { code: form.code, name: form.name, sortOrder: form.sortOrder }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['characteristic-types'] }); onClose() }
  })
  return (
    <Modal open={open} title={isEdit ? 'Edit Value' : 'Add Value'} onClose={onClose}>
      <div className="space-y-4">
        {!isEdit && <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
          <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase" />
        </div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
          <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: +e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        {isEdit && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>}
        {mutation.isError && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={!form.name || (!isEdit && !form.code) || mutation.isPending}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function TypeFormModal({ open, onClose, type }: { open: boolean; onClose: () => void; type?: CharacteristicType }) {
  const qc = useQueryClient()
  const isEdit = !!type
  const [form, setForm] = useState({ code: type?.code ?? '', name: type?.name ?? '', description: type?.description ?? '', sortOrder: type?.sortOrder ?? 0, isActive: type?.isActive ?? true })
  const mutation = useMutation({
    mutationFn: () => isEdit
      ? characteristicTypesApi.update(type!.id, { name: form.name, description: form.description, sortOrder: form.sortOrder, isActive: form.isActive })
      : characteristicTypesApi.create({ code: form.code, name: form.name, description: form.description, sortOrder: form.sortOrder }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['characteristic-types'] }); onClose() }
  })
  return (
    <Modal open={open} title={isEdit ? 'Edit Type' : 'New Characteristic Type'} onClose={onClose}>
      <div className="space-y-4">
        {!isEdit && <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
          <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
            placeholder="e.g. MATERIAL" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
          <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: +e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        {isEdit && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>}
        {mutation.isError && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={!form.name || (!isEdit && !form.code) || mutation.isPending}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function CharacteristicTypesPage() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [typeModal, setTypeModal] = useState(false)
  const [editType, setEditType] = useState<CharacteristicType | undefined>()
  const [valueModal, setValueModal] = useState<{ typeId: string; value?: CharacteristicValue } | null>(null)

  const { data = [], isLoading } = useQuery({ queryKey: ['characteristic-types'], queryFn: () => characteristicTypesApi.getAll() })

  return (
    <div>
      <PageHeader
        title="Characteristic Types"
        description="Define attributes used in product code generation"
        action={<button onClick={() => { setEditType(undefined); setTypeModal(true) }}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
          <Plus size={16} /> Add Type
        </button>}
      />

      <div className="space-y-2">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-white rounded-xl border border-gray-200 animate-pulse" />)}
        {!isLoading && data.length === 0 && <EmptyState message="No characteristic types yet." />}
        {data.map(type => (
          <div key={type.id} className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpanded(e => e === type.id ? null : type.id)}>
              <ChevronRight size={16} className={`text-gray-400 transition-transform ${expanded === type.id ? 'rotate-90' : ''}`} />
              <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{type.code}</span>
              <span className="font-medium text-gray-900">{type.name}</span>
              {type.description && <span className="text-sm text-gray-400">{type.description}</span>}
              <span className="ml-auto text-xs text-gray-400">{type.values.filter(v => v.isActive).length} values</span>
              {!type.isActive && <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">Inactive</span>}
              <button onClick={e => { e.stopPropagation(); setEditType(type); setTypeModal(true) }}
                className="text-gray-400 hover:text-brand-600 ml-2"><Pencil size={14} /></button>
            </div>

            {expanded === type.id && (
              <div className="border-t border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-600">Values</p>
                  <button onClick={() => setValueModal({ typeId: type.id })}
                    className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                    <Plus size={12} /> Add Value
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {type.values.sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code)).map(v => (
                    <div key={v.id} className={`flex items-center justify-between border rounded-lg px-3 py-2 ${v.isActive ? 'border-gray-200' : 'border-gray-100 opacity-50'}`}>
                      <div>
                        <span className="font-mono text-xs font-bold text-brand-600">{v.code}</span>
                        <p className="text-xs text-gray-600">{v.name}</p>
                      </div>
                      <button onClick={() => setValueModal({ typeId: type.id, value: v })}
                        className="text-gray-300 hover:text-brand-600 ml-2"><Pencil size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <TypeFormModal open={typeModal} onClose={() => setTypeModal(false)} type={editType} />
      {valueModal && <ValueFormModal open={true} onClose={() => setValueModal(null)} typeId={valueModal.typeId} value={valueModal.value} />}
    </div>
  )
}
