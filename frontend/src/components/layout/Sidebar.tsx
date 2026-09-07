import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingBag, List, LogOut,
  Truck, ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal,
  ClipboardList, BookOpen, Users, Ruler, UserCircle, ChevronDown,
  FileBarChart, ScrollText, Tag, Wand2, GitBranch, Layers,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

type NavItem = { to: string; icon: React.ComponentType<any>; label: string }

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mb-1">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300">
        {title}
        <ChevronDown size={13} className={cn('transition-transform', open ? '' : '-rotate-90')} />
      </button>
      {open && items.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mx-1',
            isActive ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          )}>
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </div>
  )
}

export function Sidebar() {
  const { user, clearAuth, hasRole } = useAuthStore()
  const isAdmin = hasRole('Administrator')

  const mainNav: NavItem[] = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/items', icon: Package, label: 'Inventory Items' },
    { to: '/suppliers', icon: Truck, label: 'Suppliers' },
    { to: '/reports', icon: FileBarChart, label: 'Reports' },
  ]

  const inventoryNav: NavItem[] = [
    { to: '/inventory/stock', icon: ClipboardList, label: 'Stock Balances' },
    { to: '/inventory/ledger', icon: BookOpen, label: 'Stock Ledger' },
    { to: '/inventory/receipt', icon: ArrowDownToLine, label: 'Goods Receipt' },
    { to: '/inventory/consumption', icon: ArrowUpFromLine, label: 'Consumption' },
    { to: '/inventory/adjustment', icon: SlidersHorizontal, label: 'Adjustment' },
  ]

  const productsNav: NavItem[] = [
    { to: '/product-types', icon: List, label: 'Product Types' },
    { to: '/products', icon: ShoppingBag, label: 'Products' },
    { to: '/bom', icon: GitBranch, label: 'Bill of Materials' },
  ]

  const itemCodingNav: NavItem[] = [
    { to: '/settings/characteristic-types', icon: Tag, label: 'Characteristic Types' },
    { to: '/settings/code-generator', icon: Wand2, label: 'Code Generator' },
  ]

  const adminNav: NavItem[] = [
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/audit', icon: ScrollText, label: 'Audit Log' },
    { to: '/settings/units', icon: Ruler, label: 'Units of Measure' },
  ]

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold text-white tracking-tight">CSW Inventory</h1>
        <p className="text-xs text-gray-400 mt-0.5">Manufacturing System</p>
      </div>

      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-2">
        <NavSection title="Main" items={mainNav} />
        <NavSection title="Inventory" items={inventoryNav} />
        <NavSection title="Products" items={productsNav} />
        {isAdmin && <NavSection title="Item Coding" items={itemCodingNav} />}
        {isAdmin && <NavSection title="Admin" items={adminNav} />}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <NavLink to="/settings/profile"
          className={({ isActive }) => cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors mb-1',
            isActive ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          )}>
          <UserCircle size={16} />
          <div className="overflow-hidden">
            <p className="font-medium text-current truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </NavLink>
        <button
          onClick={clearAuth}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
