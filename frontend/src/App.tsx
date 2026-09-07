import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/auth/LoginPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ItemsPage } from './pages/items/ItemsPage'
import { ProductTypesPage } from './pages/products/ProductTypesPage'
import { ProductsPage } from './pages/products/ProductsPage'
import { ProductVariantsPage } from './pages/products/ProductVariantsPage'
import { SuppliersPage } from './pages/suppliers/SuppliersPage'
import { StockLedgerPage } from './pages/inventory/StockLedgerPage'
import { StockBalancesPage } from './pages/inventory/StockBalancesPage'
import { TransactionEntryPage } from './pages/inventory/TransactionEntryPage'
import { UsersPage } from './pages/admin/UsersPage'
import { AuditLogPage } from './pages/admin/AuditLogPage'
import { ReportsPage } from './pages/reports/ReportsPage'
import { UnitsPage } from './pages/settings/UnitsPage'
import { ProfilePage } from './pages/settings/ProfilePage'
import { CharacteristicTypesPage } from './pages/item-coding/CharacteristicTypesPage'
import { CodeGeneratorPage } from './pages/item-coding/CodeGeneratorPage'
import { BomListPage } from './pages/bom/BomListPage'
import { BomDetailPage } from './pages/bom/BomDetailPage'
import { BomNewPage } from './pages/bom/BomNewPage'
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
            {/* Product Catalogue */}
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:productId/variants" element={<ProductVariantsPage />} />
            {/* Item Coding */}
            <Route path="/settings/characteristic-types" element={<CharacteristicTypesPage />} />
            <Route path="/settings/code-generator" element={<CodeGeneratorPage />} />
            {/* Inventory */}
            <Route path="/inventory/stock" element={<StockBalancesPage />} />
            <Route path="/inventory/ledger" element={<StockLedgerPage />} />
            <Route path="/inventory/receipt" element={<TransactionEntryPage mode="receipt" />} />
            <Route path="/inventory/consumption" element={<TransactionEntryPage mode="consumption" />} />
            <Route path="/inventory/adjustment" element={<TransactionEntryPage mode="adjustment" />} />
            <Route path="/inventory/opening-balance" element={<TransactionEntryPage mode="opening-balance" />} />
            {/* BOM */}
            <Route path="/bom" element={<BomListPage />} />
            <Route path="/bom/new" element={<BomNewPage />} />
            <Route path="/bom/:bomId" element={<BomDetailPage />} />
            {/* Reports */}
            <Route path="/reports" element={<ReportsPage />} />
            {/* Admin */}
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/audit" element={<AuditLogPage />} />
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
