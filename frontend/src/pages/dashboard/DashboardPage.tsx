import { useQuery } from '@tanstack/react-query'
import { Package, Layers, ShoppingBag, AlertTriangle, XCircle, ArrowUpDown, List } from 'lucide-react'
import { dashboardApi } from '@/api/dashboard'
import { formatNumber } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
  bgColor: string
  sub?: string
}

function StatCard({ label, value, icon: Icon, color, bgColor, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.getSummary,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-28 animate-pulse">
            <div className="flex gap-4">
              <div className="w-11 h-11 bg-gray-100 rounded-lg" />
              <div className="flex-1 space-y-2 mt-1">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-7 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!data) return null

  const stats: StatCardProps[] = [
    { label: 'Total Inventory Items', value: data.totalItems, icon: Package, color: 'text-brand-600', bgColor: 'bg-brand-50', sub: 'Active items' },
    { label: 'Raw Materials', value: data.rawMaterials, icon: Layers, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { label: 'Accessories', value: data.accessories, icon: ShoppingBag, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { label: 'Packaging', value: data.packaging, icon: Package, color: 'text-teal-600', bgColor: 'bg-teal-50' },
    { label: 'Low Stock Items', value: data.lowStockCount, icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-50', sub: 'Below minimum level' },
    { label: 'Out of Stock', value: data.outOfStockCount, icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', sub: 'Zero quantity' },
    { label: 'Total Transactions', value: formatNumber(data.totalTransactions, 0), icon: ArrowUpDown, color: 'text-gray-600', bgColor: 'bg-gray-100', sub: 'All time' },
    { label: 'Product Types', value: data.activeProductTypes, icon: List, color: 'text-green-600', bgColor: 'bg-green-50', sub: 'Active categories' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Inventory overview</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>
    </div>
  )
}
