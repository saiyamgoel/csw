import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Wand2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Modal } from '@/components/shared/Modal'
import { characteristicTypesApi, codeMastersApi, type CodeMaster } from '@/api/characteristicTypes'

function CodeMasterFormModal({ open, onClose, master }: { open: boolean; onClose: () => void; master?: CodeMaster }) {
  const qc = useQueryClient()
  const isEdit = !!master
  const { data: types = [] } = useQuery({ queryKey: ['characteristic-types'], queryFn: () => characteristicTypesApi.getAll(true) })
  const [form, setForm] = useState({
    segmentName: master?.segmentName ?? '',
    segmentOrder: master?.segmentOrder ?? 1,
    separator: master?.separator ?? '-',
    isOptional: master?.isOptional ?? false,
    notes: master?.notes ?? '',
    characteristicTypeId: master?.characteristicTypeId ?? '',
  })
  const mutation = useMutation({
    mutationFn: () => isEdit
      ? codeMastersApi.update(master!.id, { ...form, characteristicTypeId: form.characteristicTypeId || undefined })
      : codeMastersApi.create({ ...form, characteristicTypeId: form.characteristicTypeId || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['code-masters'] }); onClose() }
  })
  return (
    <Modal open={open} title={isEdit ? 'Edit Segment' : 'Add Code Segment'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Segment Name *</label>
          <input value={form.segmentName} onChange={e => setForm(f => ({ ...f, segmentName: e.target.value }))}
            placeholder="e.g. ProductType" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <input type="number" value={form.segmentOrder} onChange={e => setForm(f => ({ ...f, segmentOrder: +e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Separator</label>
            <input value={form.separator} onChange={e => setForm(f => ({ ...f, separator: e.target.value }))}
              placeholder="- or empty" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Characteristic Type</label>
          <select value={form.characteristicTypeId} onChange={e => setForm(f => ({ ...f, characteristicTypeId: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">— None —</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isOptional} onChange={e => setForm(f => ({ ...f, isOptional: e.target.checked }))} /> Optional segment</label>
        {mutation.isError && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={!form.segmentName || mutation.isPending}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function CodeGeneratorPage() {
  const qc = useQueryClient()
  const [masterModal, setMasterModal] = useState(false)
  const [editMaster, setEditMaster] = useState<CodeMaster | undefined>()
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [generatedCode, setGeneratedCode] = useState<{ code: string; segments: any[] } | null>(null)
  const [error, setError] = useState('')

  const { data: masters = [] } = useQuery({ queryKey: ['code-masters'], queryFn: codeMastersApi.getAll })
  const { data: types = [] } = useQuery({ queryKey: ['characteristic-types'], queryFn: () => characteristicTypesApi.getAll(true) })

  const typeMap = Object.fromEntries(types.map(t => [t.id, t]))

  const generate = async () => {
    setError('')
    try {
      const result = await codeMastersApi.generateCode(selections)
      setGeneratedCode(result)
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Code Generator"
        description="Configure code segments and preview composite codes"
        action={<button onClick={() => { setEditMaster(undefined); setMasterModal(true) }}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
          <Plus size={16} /> Add Segment
        </button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segment Configuration */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Code Segments (ordered)</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {masters.length === 0 && <div className="px-4 py-8 text-center text-sm text-gray-400">No segments configured.</div>}
            {masters.sort((a, b) => a.segmentOrder - b.segmentOrder).map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-xs text-gray-500 font-bold flex items-center justify-center">{m.segmentOrder}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{m.segmentName}</p>
                  <p className="text-xs text-gray-400">
                    sep: <span className="font-mono">{m.separator === '' ? '(none)' : m.separator}</span>
                    {m.characteristicTypeName && <> · {m.characteristicTypeName}</>}
                    {m.isOptional && <> · <span className="italic">optional</span></>}
                  </p>
                </div>
                <button onClick={() => { setEditMaster(m); setMasterModal(true) }}
                  className="text-gray-400 hover:text-brand-600"><Pencil size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Code Preview */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Preview Code</h3>
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            {masters.filter(m => m.characteristicTypeId).sort((a, b) => a.segmentOrder - b.segmentOrder).map(m => {
              const type = typeMap[m.characteristicTypeId!]
              if (!type) return null
              return (
                <div key={m.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {type.name} {!m.isOptional && <span className="text-red-400">*</span>}
                  </label>
                  <select value={selections[type.id] ?? ''} onChange={e => setSelections(s => ({ ...s, [type.id]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">— Select —</option>
                    {type.values.filter(v => v.isActive).sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code)).map(v => (
                      <option key={v.id} value={v.id}>{v.code} — {v.name}</option>
                    ))}
                  </select>
                </div>
              )
            })}

            <button onClick={generate}
              className="flex items-center gap-2 w-full justify-center bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
              <Wand2 size={15} /> Generate Code
            </button>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {generatedCode && (
              <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Generated Code</p>
                <p className="text-xl font-mono font-bold text-brand-700 tracking-widest">{generatedCode.code}</p>
                <div className="mt-3 space-y-1">
                  {generatedCode.segments.map((s, i) => (
                    <div key={i} className="flex gap-2 text-xs text-gray-500">
                      <span className="font-medium">{s.characteristicTypeName}:</span>
                      <span className="font-mono text-brand-600">{s.valueCode}</span>
                      <span>({s.valueName})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CodeMasterFormModal open={masterModal} onClose={() => setMasterModal(false)} master={editMaster} />
    </div>
  )
}
