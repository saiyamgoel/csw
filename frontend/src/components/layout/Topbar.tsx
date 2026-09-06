import { Bell } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface TopbarProps {
  title?: string
}

export function Topbar({ title }: TopbarProps) {
  const { user } = useAuthStore()
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <h2 className="text-sm font-medium text-gray-500">{title}</h2>
      <div className="flex items-center gap-3">
        <button className="text-gray-400 hover:text-gray-600">
          <Bell size={20} />
        </button>
        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-medium">
          {user?.fullName?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
