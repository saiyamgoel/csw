import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, List, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/items', icon: Package, label: 'Inventory Items' },
  { to: '/product-types', icon: List, label: 'Product Types' },
  { to: '/products', icon: ShoppingBag, label: 'Products' },
]

export function Sidebar() {
  const { user, clearAuth } = useAuthStore()

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold text-white tracking-tight">CSW Inventory</h1>
        <p className="text-xs text-gray-400 mt-0.5">Manufacturing System</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            )}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <div className="mb-3 px-2">
          <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          <p className="text-xs text-gray-500 mt-0.5">{user?.roles.join(', ')}</p>
        </div>
        <button
          onClick={clearAuth}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
