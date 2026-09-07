import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft, CheckCircle } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Modal } from '@/components/shared/Modal'
import { EmptyState } from '@/components/shared/EmptyState'
import { bomApi, type BomVersion, type BomLine } from '@/api/bom'
import { productsApi } from '@/api/products'
import { itemsApi } from '@/api/items'
import { formatDate, formatNumber } from '@/lib/utils'

function BomLineFormModal({ open, onClose, bomId, versionId, line }: {
  open: boolean; onClose: () => void; bomId: string; versionId: string; line?: BomLine
}) {
  const qc = useQueryClient()
  const isEdit = !!line
  const { data: items } = useQuery({ queryKey: ['items-all'], queryFn: () => itemsApi.getItems({ pageSize: 999 }) })
  const { data: units } = useQuery({ queryKey: ['units'], queryFn: () => itemsApi.getUnits(true) })
  const [form, setForm] = useState({
    itemId: line?.itemId ?? '',
    quantity: line?.quantity.toString() ?? '',
    unitId: line?.unitId ?? '',
    wastePercent: line?.wastePercent.toString() ?? '0',
    notes: line?.notes ?? '',
  })
  const mutation = useMutation({
    mutationFn: () => isEdit
      ? bomApi.updateLine(bomId, versionId, line!.id, { quantity: +form.quantity, unitId: form.unitId, wastePercent: +form.wastePercent, notes: form.notes })
      : bomApi.addLine(bomId, versionId, { itemId: form.itemId, quantity: +form.quantity, unitId: form.unitId, wastePercent: +form.wastePercent, notes: form.notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bom-version', bomId, versionId] }); onClose() }
  })
  return (
    <Modal open={open} title={isEdit ? 'Edit BOM Line' : 'Add BOM Line'} onClose={onClose}>
      <div className="space-y-4">
        {!isEdit && <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
          <select value={form.itemId} onChange={e => {
            const item = items?.data.find(i => i.id === e.target.value)
            setForm(f => ({ ...f, itemId: e.target.value, unitId: item?.unitId ?? f.unitId }))
          }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">— Select Item —</option>
            {items?.data.filter(i => i.isActive).map(i => <option key={i.id} value={i.id}>{i.code} — {i.name}</option>)}
          </select>
        </div>}
        {isEdit && <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
          <span className="font-mono text-xs text-gray-400">{line?.itemCode}</span>
          <span className="ml-2 font-medium text-gray-900">{line?.itemName}</span>
        </div>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <input type="number" step="0.0001" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Waste %</label>
            <input type="number" step="0.01" value={form.wastePercent} onChange={e => setForm(f => ({ ...f, wastePercent: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
          <select value={form.unitId} onChange={e => setForm(f => ({ ...f, unitId: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">— Select Unit —</option>
            {units?.map(u => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        {mutation.isError && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button onClick={() => mutation.mutate()}
            disabled={!form.itemId || !form.quantity || !form.unitId || mutation.isPending}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function statusColor(s: string) {
  if (s === 'Active') return 'bg-green-100 text-green-700'
  if (s === 'Draft') return 'bg-yellow-100 text-yellow-700'
  return 'bg-gray-100 text-gray-600'
}

export function BomDetailPage() {
  const { bomId } = useParams<{ bomId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [lineModal, setLineModal] = useState(false)
  const [editLine, setEditLine] = useState<BomLine | undefined>()

  const { data: header } = useQuery({ queryKey: ['bom-header', bomId], queryFn: () => bomApi.getHeader(bomId!) })
  const { data: versions = [] } = useQuery({ queryKey: ['bom-versions', bomId], queryFn: () => bomApi.getVersions(bomId!) })

  const activeVersionId = selectedVersionId ?? header?.currentVersionId ?? versions[0]?.id ?? null

  const { data: version } = useQuery({
    queryKey: ['bom-version', bomId, activeVersionId],
    queryFn: () => bomApi.getVersion(bomId!, activeVersionId!),
    enabled: !!activeVersionId,
  })

  const createVersionMutation = useMutation({
    mutationFn: () => bomApi.createVersion(bomId!, { effectiveFrom: new Date().toISOString().slice(0, 10) }),
    onSuccess: v => { qc.invalidateQueries({ queryKey: ['bom-versions', bomId] }); setSelectedVersionId(v.id) }
  })

  const activateMutation = useMutation({
    mutationFn: () => bomApi.activateVersion(bomId!, activeVersionId!, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bom-versions', bomId] })
      qc.invalidateQueries({ queryKey: ['bom-header', bomId] })
      qc.invalidateQueries({ queryKey: ['bom-version', bomId, activeVersionId] })
    }
  })

  const deleteLineMutation = useMutation({
    mutationFn: (lineId: string) => bomApi.deleteLine(bomId!, activeVersionId!, lineId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bom-version', bomId, activeVersionId] })
  })

  const isDraft = version?.status === 'Draft'

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/bom')} className="text-gray-400 hover:text-gray-700"><ArrowLeft size={18} /></button>
        <PageHeader
          title={header ? `BOM — ${header.variantCode}` : 'Bill of Materials'}
          description={header?.variantName}
        />
      </div>

      {/* Version selector */}
      <div className="flex flex-wrap gap-2 mb-5 items-center">
        <span className="text-sm font-medium text-gray-600">Version:</span>
        {versions.map(v => (
          <button key={v.id} onClick={() => setSelectedVersionId(v.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${(selectedVersionId ?? header?.currentVersionId ?? versions[0]?.id) === v.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            v{v.versionNumber}
            <span className={`px-1.5 py-0.5 rounded text-xs ${statusColor(v.status)}`}>{v.status}</span>
          </button>
        ))}
        <button onClick={() => createVersionMutation.mutate()} disabled={createVersionMutation.isPending}
          className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium border border-brand-200 rounded-lg px-3 py-1.5 hover:bg-brand-50">
          <Plus size={14} /> New Version
        </button>
      </div>

      {version && (
        <div>
          {/* Version header */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(version.status)}`}>{version.status}</span>
            <span className="text-sm text-gray-500">v{version.versionNumber}</span>
            {version.changeReason && <span className="text-sm text-gray-400">— {version.changeReason}</span>}
            <span className="text-sm text-gray-400 ml-auto">Created {formatDate(version.createdAt)}</span>
            {isDraft && (
              <>
                <button onClick={() => { setEditLine(undefined); setLineModal(true) }}
                  className="flex items-center gap-1 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200">
                  <Plus size={14} /> Add Line
                </button>
                <button onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending || !version.lines.length}
                  className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50">
                  <CheckCircle size={14} /> Activate
                </button>
              </>
            )}
          </div>

          {/* BOM Lines */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-12">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Quantity</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Unit</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Waste %</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Gross Qty</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
                  {isDraft && <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {version.lines.length === 0 && <tr><td colSpan={8}><EmptyState message="No lines yet. Add materials to this BOM version." /></td></tr>}
                {version.lines.map(l => {
                  const grossQty = l.quantity * (1 + l.wastePercent / 100)
                  return (
                    <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 text-xs">{l.lineNumber}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-400">{l.itemCode}</span>
                        <span className="ml-2 font-medium text-gray-900">{l.itemName}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatNumber(l.quantity, 4)}</td>
                      <td className="px-4 py-3 text-gray-500">{l.unitAbbreviation}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{l.wastePercent > 0 ? `${l.wastePercent}%` : '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatNumber(grossQty, 4)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{l.notes ?? '—'}</td>
                      {isDraft && <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditLine(l); setLineModal(true) }} className="text-gray-400 hover:text-brand-600">
                            <Plus size={14} className="rotate-45" />
                          </button>
                          <button onClick={() => deleteLineMutation.mutate(l.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {activateMutation.isError && <p className="text-sm text-red-600 mt-2">{(activateMutation.error as Error).message}</p>}
        </div>
      )}

      {!version && !versions.length && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 mb-4">No versions yet.</p>
          <button onClick={() => createVersionMutation.mutate()} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
            Create First Version
          </button>
        </div>
      )}

      {activeVersionId && <BomLineFormModal open={lineModal} onClose={() => setLineModal(false)}
        bomId={bomId!} versionId={activeVersionId} line={editLine} />}
    </div>
  )
}
