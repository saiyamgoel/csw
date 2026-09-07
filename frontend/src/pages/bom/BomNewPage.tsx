import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { bomApi } from '@/api/bom'
import { productsApi } from '@/api/products'

export function BomNewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedVariantId = searchParams.get('variantId') ?? ''
  const [variantId, setVariantId] = useState(preselectedVariantId)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: allVariants = [] } = useQuery({
    queryKey: ['all-variants'],
    queryFn: () => productsApi.getAllVariants(),
  })

  const selectedVariant = allVariants.find(v => v.id === variantId)

  const handleCreate = async () => {
    setError('')
    setSaving(true)
    try {
      const bom = await bomApi.createHeader({ productVariantId: variantId, notes })
      navigate(`/bom/${bom.id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/bom')} className="text-gray-400 hover:text-gray-700"><ArrowLeft size={18} /></button>
        <PageHeader title="Create BOM" description="Create a Bill of Materials for a product variant" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Variant *</label>
          <select value={variantId} onChange={e => setVariantId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">— Select Variant —</option>
            {allVariants.filter(v => !v.hasBom && v.isActive).map(v => (
              <option key={v.id} value={v.id}>{v.variantCode} — {v.name}</option>
            ))}
          </select>
        </div>

        {selectedVariant && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm">
            <p className="font-mono font-bold text-brand-700 text-lg">{selectedVariant.variantCode}</p>
            <p className="text-gray-600">{selectedVariant.productName} · {selectedVariant.name}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedVariant.characteristics.map(c => (
                <span key={c.characteristicTypeId} className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded">
                  {c.characteristicTypeName}: {c.characteristicValueName}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={() => navigate('/bom')} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button onClick={handleCreate} disabled={!variantId || saving}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
            {saving ? 'Creating…' : 'Create BOM'}
          </button>
        </div>
      </div>
    </div>
  )
}
