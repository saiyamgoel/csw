import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StockBadge, CategoryBadge } from '@/components/shared/Badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { ItemFormModal } from './ItemFormModal'
import { itemsApi } from '@/api/items'
import { useAuthStore } from '@/store/authStore'
import { formatNumber } from '@/lib/utils'
import type { Item, ItemCategory } from '@/types'

const CATEGORY_TABS: { value: '' | ItemCategory; label: string }[] = [
  { value: '', label: 'All Items' },
  { value: 'RAW_MATERIAL', label: 'Raw Materials' },
  { value: 'ACCESSORY', label: 'Accessories' },
  { value: 'PACKAGING', label: 'Packaging' },
]

export function ItemsPage() {
  const { hasRole } = useAuthStore()
  const qc = useQueryClient()
  const canEdit = hasRole('Administrator') || hasRole('InventoryUser')
  const canDelete = hasRole('Administrator')

  const [category, setCategory] = useState<'' | ItemCategory>('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Item | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['items', category, debouncedSearch, page],
    queryFn: () => itemsApi.getItems({ category: category || undefined, search: debouncedSearch || undefined, page, pageSize: 25 }),
  })

  const deleteMutation = useMutation({
    mutationFn: itemsApi.deleteItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] })
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })

  const handleSearchChange = (v: string) => {
    setSearch(v)
    clearTimeout((window as any).__searchTimer)
    ;(window as any).__searchTimer = setTimeout(() => { setDebouncedSearch(v); setPage(1) }, 300)
  }

  const handleCategoryChange = (cat: '' | ItemCategory) => {
    setCategory(cat); setPage(1)
  }

  const handleDelete = (item: Item) => {
    if (confirm(`Deactivate "${item.name}"? This item will be hidden from active lists.`)) {
      deleteMutation.mutate(item.id)
    }
  }

  const openCreate = () => { setEditItem(undefined); setModalOpen(true) }
  const openEdit = (item: Item) => { setEditItem(item); setModalOpen(true) }

  return (
    <div>
      <PageHeader
        title="Inventory Items"
        description="Manage raw materials, accessories, and packaging"
        action={canEdit ? (
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
            <Plus size={16} /> Add Item
          </button>
        ) : undefined}
      />

      {/* Category tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {CATEGORY_TABS.map((tab) => (
          <button key={tab.value} onClick={() => handleCategoryChange(tab.value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${category === tab.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name or code…"
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Unit</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              {canEdit && <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">
                {Array.from({ length: canEdit ? 7 : 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                ))}
              </tr>
            ))}
            {!isLoading && data?.data.length === 0 && (
              <tr><td colSpan={canEdit ? 7 : 6}><EmptyState message="No items found. Try a different filter or add a new item." /></td></tr>
            )}
            {!isLoading && data?.data.map((item) => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.code}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                <td className="px-4 py-3"><CategoryBadge category={item.category} /></td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{formatNumber(item.currentStock)}</td>
                <td className="px-4 py-3 text-gray-500">{item.unitAbbreviation}</td>
                <td className="px-4 py-3"><StockBadge status={item.stockStatus} /></td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="text-gray-400 hover:text-brand-600 transition-colors"><Pencil size={15} /></button>
                      {canDelete && <button onClick={() => handleDelete(item)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={page} pageSize={25} total={data.total} onChange={setPage} />}

      <ItemFormModal open={modalOpen} onClose={() => setModalOpen(false)} item={editItem} />
    </div>
  )
}
