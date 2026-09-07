import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Pencil, ArrowLeft, Wand2, GitBranch } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Modal } from '@/components/shared/Modal'
import { EmptyState } from '@/components/shared/EmptyState'
import { productsApi, type ProductVariant } from '@/api/products'
import { characteristicTypesApi, codeMastersApi } from '@/api/characteristicTypes'
import { itemsApi } from '@/api/items'

function VariantFormModal({ open, onClose, productId, variant }: {
  open: boolean; onClose: () => void; productId: string; variant?: ProductVariant
}) {
  const qc = useQueryClient()
  const isEdit = !!variant
  const { data: types = [] } = useQuery({ queryKey: ['characteristic-types'], queryFn: () => characteristicTypesApi.getAll(true) })
  const { data: units } = useQuery({ queryKey: ['units'], queryFn: () => itemsApi.getUnits(true) })

  const [form, setForm] = useState({
    name: variant?.name ?? '',
    unitId: variant?.unitId ?? '',
    sellingPrice: variant?.sellingPrice?.toString() ?? '',
    notes: variant?.notes ?? '',
    isActive: variant?.isActive ?? true,
  })
  const [selections, setSelections] = useState<Record<string, string>>(
    Object.fromEntries(variant?.characteristics.map(c => [c.characteristicTypeId, c.characteristicValueId]) ?? [])
  )
  const [preview, setPreview] = useState(variant?.variantCode ?? '')
  const [previewError, setPreviewError] = useState('')

  const generatePreview = async () => {
    setPreviewError('')
    try {
      const result = await codeMastersApi.generateCode(selections)
      setPreview(result.code)
    } catch (e: any) { setPreviewError(e.message) }
  }

  const mutation = useMutation({
    mutationFn: () => isEdit
      ? productsApi.updateVariant(variant!.id, { name: form.name, unitId: form.unitId, sellingPrice: form.sellingPrice ? +form.sellingPrice : undefined, notes: form.notes, isActive: form.isActive })
      : productsApi.createVariant({ productId, name: form.name, unitId: form.unitId, sellingPrice: form.sellingPrice ? +form.sellingPrice : undefined, notes: form.notes, characteristics: selections }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['variants', productId] }); onClose() }
  })

  return (
    <Modal open={open} title={isEdit ? 'Edit Variant' : 'New Product Variant'} onClose={onClose}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {!isEdit && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              Select characteristic values to auto-generate the variant code.
            </div>
            {types.map(type => (
              <div key={type.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{type.name}</label>
                <select value={selections[type.id] ?? ''} onChange={e => setSelections(s => ({ ...s, [type.id]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">— Select —</option>
                  {type.values.filter(v => v.isActive).sort((a, b) => a.sortOrder - b.sortOrder).map(v => (
                    <option key={v.id} value={v.id}>{v.code} — {v.name}</option>
                  ))}
                </select>
              </div>
            ))}
            <button onClick={generatePreview} className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium">
              <Wand2 size={14} /> Preview Code
            </button>
            {previewError && <p className="text-xs text-red-600">{previewError}</p>}
            {preview && <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 mb-1">Generated Code</p>
              <p className="text-lg font-mono font-bold text-brand-700">{preview}</p>
            </div>}
          </>
        )}
        {isEdit && <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 mb-1">Variant Code (immutable)</p>
          <p className="text-base font-mono font-bold text-brand-700">{variant?.variantCode}</p>
        </div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
          <select value={form.unitId} onChange={e => setForm(f => ({ ...f, unitId: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">— Select —</option>
            {units?.map(u => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
          <input type="number" value={form.sellingPrice} onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        {isEdit && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>}
        {mutation.isError && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button onClick={() => mutation.mutate()}
            disabled={!form.name || !form.unitId || (!isEdit && Object.keys(selections).length === 0) || mutation.isPending}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function ProductVariantsPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const [variantModal, setVariantModal] = useState(false)
  const [editVariant, setEditVariant] = useState<ProductVariant | undefined>()

  const { data: product } = useQuery({ queryKey: ['product', productId], queryFn: () => productsApi.getById(productId!) })
  const { data: variants = [], isLoading } = useQuery({
    queryKey: ['variants', productId],
    queryFn: () => productsApi.getVariants(productId!),
    enabled: !!productId,
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate('/products')} className="text-gray-400 hover:text-gray-700"><ArrowLeft size={18} /></button>
        <PageHeader
          title={product ? `Variants — ${product.name}` : 'Product Variants'}
          description={product ? `${product.productTypeName} · ${variants.length} variants` : ''}
          action={<button onClick={() => { setEditVariant(undefined); setVariantModal(true) }}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
            <Plus size={16} /> Add Variant
          </button>}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Variant Code</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Characteristics</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Unit</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">BOM</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">{Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
            ))}
            {!isLoading && variants.length === 0 && <tr><td colSpan={8}><EmptyState message="No variants yet. Add one to get started." /></td></tr>}
            {!isLoading && variants.map(v => (
              <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-sm font-bold text-brand-700">{v.variantCode}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {v.characteristics.map(c => (
                      <span key={c.characteristicTypeId} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">{c.characteristicValueCode}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{v.unitName}</td>
                <td className="px-4 py-3 text-right text-gray-600">{v.sellingPrice ? `₹${v.sellingPrice}` : '—'}</td>
                <td className="px-4 py-3">
                  {v.hasBom
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Has BOM</span>
                    : <button onClick={() => navigate(`/bom/new?variantId=${v.id}`)} className="text-xs text-gray-400 hover:text-brand-600">Create BOM</button>}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${v.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {v.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {v.hasBom && <button onClick={() => navigate(`/bom?variantId=${v.id}`)} className="text-gray-400 hover:text-brand-600"><GitBranch size={15} /></button>}
                    <button onClick={() => { setEditVariant(v); setVariantModal(true) }} className="text-gray-400 hover:text-brand-600"><Pencil size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {productId && <VariantFormModal open={variantModal} onClose={() => setVariantModal(false)} productId={productId} variant={editVariant} />}
    </div>
  )
}
