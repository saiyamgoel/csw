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

### Domain Entities
- [x] User, Role, UserRole
- [x] Unit
- [x] Item (RawMaterial / Accessory / Packaging)
- [x] InventoryBalance, InventoryTransaction
- [x] ProductType
- [x] Supplier
- [x] AuditEvent
- [x] CharacteristicType, CharacteristicValue
- [x] CodeMaster, CodeGenerationRule
- [x] Product, ProductVariant, ProductVariantCharacteristic
- [x] BomHeader, BomVersion, BomLine
- [ ] StockReservation
- [ ] ReorderPolicy

### API Controllers / Services
- [x] `AuthController` — POST /api/v1/auth/login, GET /api/v1/auth/me
- [x] `ItemsController` — GET/POST/PUT/DELETE /api/v1/items, GET/POST/PUT /api/v1/units
- [x] `ProductTypesController` — GET/POST/PUT/DELETE /api/v1/product-types
- [x] `DashboardController` — GET /api/v1/dashboard/summary
- [x] `SuppliersController` — GET/POST/PUT/DELETE /api/v1/suppliers
- [x] `UsersController` — GET/POST/PUT /api/v1/users, role assign/remove, change password
- [x] `InventoryController` — GET balances, GET transactions (ledger), POST receipt/consumption/adjustment/opening-balance, POST void
- [x] `ReportsController` — current inventory CSV, low stock CSV, stock movement CSV, audit log
- [x] `CharacteristicTypesController` — GET/POST/PUT /api/v1/characteristic-types + values CRUD
- [x] `CodeMastersController` — GET/POST/PUT /api/v1/code-masters + POST /api/v1/generate-code
- [x] `ProductsController` — GET/POST/PUT /api/v1/products + GET/POST/PUT /api/v1/products/variants
- [x] `BomController` — GET/POST /api/v1/boms, versions CRUD, lines CRUD, activate workflow
- [ ] Availability Check
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
- [x] Dashboard (`/dashboard`) — KPI cards + today's receipt/consumption counts
- [x] Items list (`/items`) — paginated table, category filter, create/edit/deactivate
- [x] Product Types (`/product-types`) — create/edit/deactivate
- [x] Suppliers (`/suppliers`) — paginated, create/edit/deactivate
- [x] Stock Balances (`/inventory/stock`) — live balance table with low-stock filter
- [x] Stock Ledger (`/inventory/ledger`) — full transaction history, filterable, void
- [x] Goods Receipt (`/inventory/receipt`) — post receipt form
- [x] Consumption (`/inventory/consumption`) — post consumption form
- [x] Stock Adjustment (`/inventory/adjustment`) — positive/negative adjustment
- [x] Opening Balance (`/inventory/opening-balance`) — one-time per item
- [x] User Management (`/admin/users`) — create/edit users, role assignment (Admin)
- [x] Audit Log (`/admin/audit`) — paginated events, action/user/date filters (Admin)
- [x] Reports (`/reports`) — current inventory, low stock, stock movement with CSV export
- [x] Units of Measure (`/settings/units`) — create/edit units (Admin)
- [x] Profile (`/settings/profile`) — view info + change password
- [x] Characteristic Types (`/settings/characteristic-types`) — type accordion + values grid, CRUD (Admin)
- [x] Code Generator (`/settings/code-generator`) — segment config + interactive code preview (Admin)
- [x] Products list (`/products`) — paginated, type filter, create/edit
- [x] Product Variants (`/products/:productId/variants`) — variant list, characteristic picker, live code preview, create
- [x] BOM List (`/bom`) — headers with variant code and status
- [x] BOM Detail (`/bom/:bomId`) — version selector, line editor, activate workflow
- [x] BOM New (`/bom/new`) — create header with variant picker
- [ ] Availability Check page
- [ ] BOM version diff view

---

## Seeded Data
- 4 roles: Administrator, InventoryUser, ProductionUser, ManagementUser
- 2 users: admin@csw.local / Admin@123, inventory@csw.local / Inventory@123
- 7 units of measure: KG, G, PCS, MTR, LTR, SET, BOX
- 6 product types: Sauce Pan, Kadai, Fry Pan, Casserole, Pressure Cooker, Wok
- 9 items with opening inventory balances
- 6 characteristic types: PRODUCT_TYPE, MATERIAL, SIZE, HANDLE_TYPE, FINISH, LID_TYPE (with values)
- 6 code master segments + 6 generation rules

---

## Phase Tracking

| Phase | Scope | Status |
|---|---|---|
| Phase 1 | Core foundation: auth, items, product types, inventory, dashboard, reports | **Complete** |
| Phase 2 | BOM + Product Catalogue + Item Coding | ~80% done (Availability Check remaining) |
| Phase 3 | Replenishment, advanced reports, bulk import, integrations | Not started |
