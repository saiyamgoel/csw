import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GitBranch } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { bomApi } from '@/api/bom'

export function BomListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const variantIdFilter = searchParams.get('variantId') ?? ''

  const { data: boms = [], isLoading } = useQuery({
    queryKey: ['boms', variantIdFilter],
    queryFn: () => bomApi.getHeaders(variantIdFilter || undefined),
  })

  function statusColor(s: string | null) {
    if (s === 'Active') return 'bg-green-100 text-green-700'
    if (s === 'Draft') return 'bg-yellow-100 text-yellow-700'
    if (s === 'Superseded') return 'bg-gray-100 text-gray-600'
    return 'bg-gray-100 text-gray-500'
  }

  return (
    <div>
      <PageHeader title="Bill of Materials" description="BOM headers linked to product variants" />
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Variant Code</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Variant Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Active Version</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
            ))}
            {!isLoading && boms.length === 0 && <tr><td colSpan={5}><EmptyState message="No BOMs found." /></td></tr>}
            {!isLoading && boms.map(b => (
              <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/bom/${b.id}`)}>
                <td className="px-4 py-3 font-mono text-sm font-bold text-brand-700">{b.variantCode}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{b.variantName}</td>
                <td className="px-4 py-3 text-gray-500">{b.currentVersionNumber ? `v${b.currentVersionNumber}` : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(b.currentVersionStatus)}`}>
                    {b.currentVersionStatus ?? 'No Versions'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <button onClick={e => { e.stopPropagation(); navigate(`/bom/${b.id}`) }}
                      className="text-gray-400 hover:text-brand-600"><GitBranch size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
