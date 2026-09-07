# CSW Inventory System — Implementation Status

> Keep this file updated as features are built. Every completed item should be checked, every in-progress item should note what's left.

---

## Backend (ASP.NET Core 8 · `backend/src/Csw.Api/`)

### Infrastructure
- [x] Docker Compose stack (postgres, backend, frontend, nginx)
- [x] ASP.NET Core 8 project scaffold with EF Core 8 + Npgsql
- [x] JWT Bearer auth (login, `/auth/me`)
- [x] `EnsureCreated()` + `DbInitializer` seeding (no formal migrations yet)
- [x] Exception middleware (`ExceptionMiddleware.cs`)
- [x] Swagger / OpenAPI
- [x] `GET /health/live` endpoint
- [ ] EF Core formal migrations (currently using EnsureCreated)
- [ ] Hangfire background jobs
- [ ] Audit middleware / AuditEvent capture

### Domain Entities
- [x] User, Role, UserRole
- [x] Unit
- [x] Item (RawMaterial / Accessory / Packaging)
- [x] InventoryBalance, InventoryTransaction
- [x] ProductType
- [x] Supplier
- [ ] CharacteristicType, CharacteristicValue
- [ ] CodeMaster, CodeGenerationRule
- [ ] Product, ProductVariant, ProductVariantCharacteristic
- [ ] BomHeader, BomVersion, BomLine
- [ ] AuditEvent
- [ ] StockReservation
- [ ] ReorderPolicy

### API Controllers / Services
- [x] `AuthController` — POST /api/v1/auth/login, GET /api/v1/auth/me
- [x] `ItemsController` — GET/POST/PUT/DELETE /api/v1/items, GET /api/v1/units
- [x] `ProductTypesController` — GET/POST/PUT/DELETE /api/v1/product-types
- [x] `DashboardController` — GET /api/v1/dashboard/summary
- [ ] Suppliers CRUD
- [ ] Users & Roles management (Admin)
- [ ] Characteristic Types & Values CRUD
- [ ] Code Masters & Rules CRUD + code generation preview
- [ ] Products CRUD
- [ ] Product Variants CRUD (with code generation)
- [ ] BOM CRUD (headers, versions, lines, activate workflow)
- [ ] Inventory Ledger (receipt, consumption, adjustment, opening balance, void)
- [ ] Availability Check
- [ ] Reports (current inventory, low stock, stock movement)
- [ ] Reorder Policies

---

## Frontend (React 18 + Vite · `frontend/src/`)

### Infrastructure
- [x] Vite + React 18 + TypeScript + Tailwind CSS v3
- [x] TanStack Query v5, Zustand (with persist), Axios, React Router v6, Lucide React
- [x] Axios client with Bearer token interceptor + 401 redirect
- [x] Auth store (Zustand persist)
- [x] AppShell (sidebar + topbar)
- [x] Shared components: Modal, Badge, EmptyState, PageHeader, Pagination

### Pages
- [x] Login page (`/login`)
- [x] Dashboard (`/dashboard`) — KPI cards (total items, low/in-stock counts)
- [x] Items list (`/items`) — paginated table, category filter, create/edit/deactivate
- [x] Product Types (`/product-types`) — create/edit/deactivate
- [ ] Suppliers list + form
- [ ] Characteristic Types + Values pages
- [ ] Code Generator preview page
- [ ] Products list + form
- [ ] Product Variants form (characteristic picker → live code preview → save)
- [ ] BOM editor (version selector, line editor, activate workflow)
- [ ] BOM version diff view
- [ ] Stock Ledger view
- [ ] Receipt / Consumption / Adjustment entry forms
- [ ] Opening Balance entry
- [ ] Availability Check page
- [ ] Reports (current inventory, low stock, stock movement)
- [ ] User management + role assignment (Admin)
- [ ] Audit Log (Admin)
- [ ] Units of Measure CRUD
- [ ] Profile + password change

---

## Seeded Data
- 4 roles: Administrator, InventoryUser, ProductionUser, ManagementUser
- 2 users: admin@csw.local / Admin@123, inventory@csw.local / Inventory@123
- 7 units of measure: KG, G, PCS, MTR, LTR, SET, BOX
- 6 product types: Sauce Pan, Kadai, Fry Pan, Casserole, Pressure Cooker, Wok
- 9 items with opening inventory balances

---

## Phase Tracking

| Phase | Scope | Status |
|---|---|---|
| Phase 1 | Core foundation: auth, items, product types, dashboard | ~60% done (inventory ledger, suppliers, users, reports missing) |
| Phase 2 | BOM + Product Catalogue + Availability Check | Not started |
| Phase 3 | Replenishment, advanced reports, bulk import, integrations | Not started |
