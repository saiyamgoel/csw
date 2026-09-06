import { Package } from 'lucide-react'

export function EmptyState({ message = 'No records found' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Package size={48} className="mb-4 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
