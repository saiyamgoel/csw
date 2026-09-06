import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
      <span>Showing {((page - 1) * pageSize) + 1}&ndash;{Math.min(page * pageSize, total)} of {total}</span>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(page - 1)} disabled={page === 1}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = i + 1
          return (
            <button key={p} onClick={() => onChange(p)}
              className={`w-8 h-8 rounded text-sm ${p === page ? 'bg-brand-600 text-white' : 'hover:bg-gray-100'}`}>
              {p}
            </button>
          )
        })}
        <button
          onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
