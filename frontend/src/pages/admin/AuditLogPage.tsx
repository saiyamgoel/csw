import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { reportsApi } from '@/api/reports'
import { formatDate } from '@/lib/utils'

const ACTION_OPTIONS = [
  '', 'USER_LOGIN', 'USER_LOGIN_FAILED', 'RECEIPT_POST', 'CONSUMPTION_POST',
  'ADJUSTMENT_POST', 'OPENING_BALANCE_POST', 'TRANSACTION_VOID',
]

function statusBadge(status: string) {
  return status === 'SUCCESS'
    ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Success</span>
    : <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">{status}</span>
}

function actionBadge(action: string) {
  const colors: Record<string, string> = {
    USER_LOGIN: 'bg-blue-50 text-blue-700',
    USER_LOGIN_FAILED: 'bg-red-50 text-red-700',
    RECEIPT_POST: 'bg-green-50 text-green-700',
    CONSUMPTION_POST: 'bg-orange-50 text-orange-700',
    ADJUSTMENT_POST: 'bg-purple-50 text-purple-700',
    OPENING_BALANCE_POST: 'bg-teal-50 text-teal-700',
    TRANSACTION_VOID: 'bg-gray-100 text-gray-700',
  }
  return <span className={`px-2 py-0.5 rounded text-xs font-medium font-mono ${colors[action] ?? 'bg-gray-50 text-gray-600'}`}>{action}</span>
}

export function AuditLogPage() {
  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [username, setUsername] = useState('')
  const [from, setFrom] = useState(weekAgo)
  const [to, setTo] = useState(today)

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', page, action, username, from, to],
    queryFn: () => reportsApi.getAuditLog({ action: action || undefined, username: username || undefined, from, to, page, pageSize: 50 }),
  })

  return (
    <div>
      <PageHeader title="Audit Log" description="System event history" />

      <div className="flex flex-wrap gap-3 mb-4">
        <select value={action} onChange={e => { setAction(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All Actions</option>
          {ACTION_OPTIONS.filter(Boolean).map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <input placeholder="Username" value={username} onChange={e => { setUsername(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-48" />
        <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <span className="text-gray-400 text-sm self-center">to</span>
        <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        {data && <span className="text-sm text-gray-500 self-center ml-auto">{data.total} events</span>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Time</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Entity</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Details</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">
                {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
              </tr>
            ))}
            {!isLoading && data?.data.length === 0 && <tr><td colSpan={6}><EmptyState message="No audit events in the selected range." /></td></tr>}
            {!isLoading && data?.data.map(e => (
              <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{formatDate(e.eventTime, true)}</td>
                <td className="px-4 py-3">{actionBadge(e.action)}</td>
                <td className="px-4 py-3 text-gray-700">{e.username ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {e.entityType && <span>{e.entityType}</span>}
                  {e.entityId && <span className="ml-1 font-mono text-gray-400">{e.entityId.slice(0, 8)}…</span>}
                  {!e.entityType && '—'}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{e.details ?? '—'}</td>
                <td className="px-4 py-3">{statusBadge(e.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={page} pageSize={50} total={data.total} onChange={setPage} />}
    </div>
  )
}
