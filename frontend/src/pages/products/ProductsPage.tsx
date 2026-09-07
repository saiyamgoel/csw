import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Modal } from '@/components/shared/Modal'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { productsApi, type Product } from '@/api/products'

function ProductFormModal({ open, onClose, product }: { open: boolean; onClose: () => void; product?: Product }) {
  const qc = useQueryClient()
  const isEdit = !!product
  const { data: ptData } = useQuery({ queryKey: ['product-types'], queryFn: () => import('@/api/productTypes').then(m => m.productTypesApi.getProductTypes({ pageSize: 100 }).then(r => r.data)) })
  const [form, setForm] = useState({
    productTypeId: product?.productTypeId ?? '',
    name: product?.name ?? '',
    description: product?.description ?? '',
    isActive: product?.isActive ?? true,
  })
  const mutation = useMutation({
    mutationFn: () => isEdit
      ? productsApi.update(product!.id, { name: form.name, description: form.description, isActive: form.isActive })
      : productsApi.create({ productTypeId: form.productTypeId, name: form.name, description: form.description }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); onClose() }
  })
  return (
    <Modal open={open} title={isEdit ? 'Edit Product' : 'New Product'} onClose={onClose}>
      <div className="space-y-4">
        {!isEdit && <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Type *</label>
          <select value={form.productTypeId} onChange={e => setForm(f => ({ ...f, productTypeId: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">— Select —</option>
            {ptData?.map((pt: any) => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
          </select>
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
        {isEdit && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>}
        {mutation.isError && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={!form.name || (!isEdit && !form.productTypeId) || mutation.isPending}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function ProductsPage() {
  const [page, setPage] = useState(1)
  const [productTypeFilter, setProductTypeFilter] = useState('')
  const [productModal, setProductModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, productTypeFilter],
    queryFn: () => productsApi.getAll({ productTypeId: productTypeFilter || undefined, page, pageSize: 20 }),
  })
  const { data: ptData } = useQuery({ queryKey: ['product-types'], queryFn: () => import('@/api/productTypes').then(m => m.productTypesApi.getProductTypes({ pageSize: 100 }).then(r => r.data)) })

  return (
    <div>
      <PageHeader
        title="Products"
        description="Product catalogue grouped by type"
        action={<button onClick={() => { setEditProduct(undefined); setProductModal(true) }}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
          <Plus size={16} /> Add Product
        </button>}
      />

      <div className="mb-4">
        <select value={productTypeFilter} onChange={e => { setProductTypeFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All Types</option>
          {ptData?.map((pt: any) => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Variants</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
            ))}
            {!isLoading && data?.data.length === 0 && <tr><td colSpan={6}><EmptyState message="No products found." /></td></tr>}
            {!isLoading && data?.data.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.productTypeName}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{p.description ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <a href={`/products/${p.id}/variants`} className="text-brand-600 hover:underline font-medium">{p.variantCount}</a>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <a href={`/products/${p.id}/variants`} className="text-gray-400 hover:text-brand-600"><ChevronRight size={15} /></a>
                    <button onClick={() => { setEditProduct(p); setProductModal(true) }} className="text-gray-400 hover:text-brand-600"><Pencil size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={page} pageSize={20} total={data.total} onChange={setPage} />}
      <ProductFormModal open={productModal} onClose={() => setProductModal(false)} product={editProduct} />
    </div>
  )
}
