import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/auth/LoginPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ItemsPage } from './pages/items/ItemsPage'
import { ProductTypesPage } from './pages/products/ProductTypesPage'
import { SuppliersPage } from './pages/suppliers/SuppliersPage'
import { StockLedgerPage } from './pages/inventory/StockLedgerPage'
import { StockBalancesPage } from './pages/inventory/StockBalancesPage'
import { TransactionEntryPage } from './pages/inventory/TransactionEntryPage'
import { UsersPage } from './pages/admin/UsersPage'
import { UnitsPage } from './pages/settings/UnitsPage'
import { ProfilePage } from './pages/settings/ProfilePage'
import { NotFound } from './pages/NotFound'

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/product-types" element={<ProductTypesPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            {/* Inventory */}
            <Route path="/inventory/stock" element={<StockBalancesPage />} />
            <Route path="/inventory/ledger" element={<StockLedgerPage />} />
            <Route path="/inventory/receipt" element={<TransactionEntryPage mode="receipt" />} />
            <Route path="/inventory/consumption" element={<TransactionEntryPage mode="consumption" />} />
            <Route path="/inventory/adjustment" element={<TransactionEntryPage mode="adjustment" />} />
            <Route path="/inventory/opening-balance" element={<TransactionEntryPage mode="opening-balance" />} />
            {/* Admin */}
            <Route path="/admin/users" element={<UsersPage />} />
            {/* Settings */}
            <Route path="/settings/units" element={<UnitsPage />} />
            <Route path="/settings/profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
