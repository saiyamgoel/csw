# Inventory Management System — Implementation Plan

## 1. Executive Summary

This document is the single source of truth for building the **Cookware Manufacturer Inventory Management System (CMIMS)**. The system tracks raw materials, accessories, and packaging materials through an immutable ledger, maintains a versioned Bill of Materials per product variant, generates composite item codes from a code master, and checks product availability against current stock. It is deployed as a Docker Compose stack on a Windows PC on the local factory network and is accessible from any browser on that network, including mobile devices.

The target users are:
- **Administrator** — full system access, user management, master data setup
- **Inventory User** — stock receipts, consumption entries, adjustments, queries
- **Production User** — BOM lookup, availability checks, production-order consumption recording
- **Management User** — read-only dashboards and reports

---

## 2. Technology Stack

### 2.1 Backend — ASP.NET Core 8 (C#)

**Choice: ASP.NET Core 8** (LTS).

Justification:
- .NET 8 is the current LTS release with Microsoft-backed security patches through November 2026.
- ASP.NET Core's built-in DI, middleware pipeline, and minimal-API / controller model map cleanly onto the modular monolith architecture defined in the technical spec.
- Entity Framework Core 8 + Npgsql gives a first-class PostgreSQL ORM with strongly-typed migrations stored in source control — equivalent to SQLAlchemy + Alembic but with compile-time safety across the entire stack.
- `FluentValidation` validates request DTOs with the same expressiveness as Pydantic v2 but in idiomatic C#.
- Hangfire (PostgreSQL-backed) replaces Celery + Redis — background jobs and scheduled tasks run without a separate message broker, reducing the container count from 6 to 4.
- Swashbuckle generates OpenAPI 3 docs automatically — no extra tooling.
- `dotnet publish --self-contained false` produces a small runtime-dependent image on top of the official `mcr.microsoft.com/dotnet/aspnet:8.0` base.

| Package (NuGet) | Version | Purpose |
|---|---|---|
| Microsoft.AspNetCore (built-in) | 8.0.x | Web framework |
| Microsoft.EntityFrameworkCore | 8.0.x | ORM |
| Npgsql.EntityFrameworkCore.PostgreSQL | 8.0.x | PostgreSQL EF Core provider |
| Microsoft.EntityFrameworkCore.Design | 8.0.x | EF Core migration tooling |
| Microsoft.AspNetCore.Authentication.JwtBearer | 8.0.x | JWT bearer authentication |
| BCrypt.Net-Next | 4.0.x | Password hashing (bcrypt) |
| FluentValidation.AspNetCore | 11.x | Request DTO validation |
| Hangfire.AspNetCore | 1.8.x | Background job processing |
| Hangfire.PostgreSql | 1.20.x | PostgreSQL job store (no Redis needed) |
| Serilog.AspNetCore | 8.x | Structured JSON logging |
| Serilog.Sinks.Console | 5.x | Console sink for Docker logs |
| QuestPDF | 2024.x | PDF report generation |
| ClosedXML | 0.102.x | Excel export |
| Swashbuckle.AspNetCore | 6.x | OpenAPI / Swagger UI |
| xunit | 2.9.x | Test framework |
| Moq | 4.20.x | Test mocking |
| Microsoft.AspNetCore.Mvc.Testing | 8.0.x | Integration test web factory |

### 2.2 Frontend — React 18 + Vite + TypeScript

**Choice: React 18** (not Next.js, not Vue).

Justification:
- This is a factory-network deployed app — SSR (Next.js) adds complexity with zero benefit because there is no public internet SEO requirement.
- React's ecosystem (React Query, React Hook Form, Recharts) is the most mature for data-heavy CRUD applications.
- Vite provides near-instant HMR during development and produces compact production builds.
- TypeScript catches API contract mismatches at compile time.
- PWA support is a Vite plugin (`vite-plugin-pwa`), not a framework feature — works equally well here.

| Library | Version | Purpose |
|---|---|---|
| react | 18.3.x | UI framework |
| react-dom | 18.3.x | DOM rendering |
| typescript | 5.5.x | Type safety |
| vite | 5.3.x | Build tool + dev server |
| vite-plugin-pwa | 0.20.x | Service worker + manifest |
| @tanstack/react-query | 5.x | Server state management |
| react-router-dom | 6.x | Client-side routing |
| react-hook-form | 7.x | Form state + validation |
| zod | 3.x | Schema validation (shared with API contracts) |
| @hookform/resolvers | 3.x | Zod adapter for RHF |
| axios | 1.7.x | HTTP client |
| recharts | 2.12.x | Charts and KPI visualisations |
| @radix-ui/react-* | latest | Headless accessible primitives |
| tailwindcss | 3.4.x | Utility CSS |
| shadcn/ui | latest | Component library built on Radix + Tailwind |
| lucide-react | 0.400.x | Icon set |
| date-fns | 3.x | Date arithmetic |
| @tanstack/react-table | 8.x | Headless table for grids |

### 2.3 Database — PostgreSQL 16

Single source of truth. All stock balances are derived from or cached from `inventory_transactions`. Read replicas are not needed at factory scale but the schema is replica-friendly.

### 2.4 Infrastructure

| Component | Technology |
|---|---|
| Reverse proxy | Nginx (Alpine) |
| Container orchestration | Docker Compose v2 |
| Background worker | Hangfire (in-process, PostgreSQL-backed) |
| Scheduled jobs | Hangfire recurring jobs (no separate broker) |
| Backup | pg_dump via a dedicated cron container |
| Secret management | `.env` file (not committed) + Docker secrets in Compose |

---

## 3. Project Folder Structure

```
csw/
├── docker-compose.yml
├── docker-compose.override.yml          # dev overrides (hot-reload volumes)
├── .env.example
├── .gitignore
├── README.md
│
├── nginx/
│   ├── nginx.conf
│   └── ssl/                             # self-signed certs for LAN HTTPS
│
├── backup/
│   ├── Dockerfile
│   └── backup.sh                        # pg_dump + rsync to NAS
│
├── backend/
│   ├── Dockerfile
│   ├── Csw.sln
│   │
│   ├── src/
│   │   │
│   │   ├── Csw.Api/                              # ASP.NET Core Web API host
│   │   │   ├── Csw.Api.csproj
│   │   │   ├── Program.cs                        # app builder, DI registrations, middleware pipeline
│   │   │   ├── appsettings.json
│   │   │   ├── appsettings.Production.json
│   │   │   ├── Controllers/
│   │   │   │   ├── AuthController.cs
│   │   │   │   ├── UsersController.cs
│   │   │   │   ├── ItemsController.cs
│   │   │   │   ├── ProductTypesController.cs
│   │   │   │   ├── ProductsController.cs
│   │   │   │   ├── ProductVariantsController.cs
│   │   │   │   ├── CharacteristicTypesController.cs
│   │   │   │   ├── CodeRulesController.cs
│   │   │   │   ├── BomController.cs
│   │   │   │   ├── InventoryController.cs
│   │   │   │   ├── AvailabilityController.cs
│   │   │   │   ├── ReorderPoliciesController.cs
│   │   │   │   ├── ReportsController.cs
│   │   │   │   └── AdminController.cs
│   │   │   ├── Middleware/
│   │   │   │   ├── RequestIdMiddleware.cs
│   │   │   │   └── AuditMiddleware.cs
│   │   │   └── Extensions/
│   │   │       ├── AuthServiceExtensions.cs      # JWT bearer setup
│   │   │       ├── HangfireExtensions.cs          # Hangfire + recurring jobs
│   │   │       └── SwaggerExtensions.cs
│   │   │
│   │   ├── Csw.Application/                      # Business logic layer
│   │   │   ├── Csw.Application.csproj
│   │   │   ├── Common/
│   │   │   │   ├── PagedResult.cs                # Page<T> generic DTO
│   │   │   │   ├── IdempotencyService.cs         # idempotency key store (DB-backed)
│   │   │   │   └── Exceptions/
│   │   │   │       ├── BusinessException.cs
│   │   │   │       └── NotFoundException.cs
│   │   │   └── Services/
│   │   │       ├── Identity/
│   │   │       │   ├── AuthService.cs            # login, token issue, refresh
│   │   │       │   ├── UserService.cs
│   │   │       │   └── DTOs/                     # LoginRequest, TokenResponse, UserDto
│   │   │       ├── MasterData/
│   │   │       │   ├── UnitService.cs
│   │   │       │   ├── SupplierService.cs
│   │   │       │   └── DTOs/
│   │   │       ├── ItemCoding/
│   │   │       │   ├── CodeGenerationService.cs  # composite code algorithm
│   │   │       │   └── DTOs/
│   │   │       ├── ProductCatalogue/
│   │   │       │   ├── ProductTypeService.cs
│   │   │       │   ├── ProductVariantService.cs
│   │   │       │   └── DTOs/
│   │   │       ├── ItemMaster/
│   │   │       │   ├── ItemService.cs
│   │   │       │   └── DTOs/
│   │   │       ├── Bom/
│   │   │       │   ├── BomService.cs             # BOM CRUD, version activation
│   │   │       │   └── DTOs/
│   │   │       ├── Inventory/
│   │   │       │   ├── LedgerService.cs          # post transaction + update balance
│   │   │       │   ├── BalanceService.cs         # balance queries
│   │   │       │   └── DTOs/
│   │   │       ├── Availability/
│   │   │       │   ├── AvailabilityService.cs
│   │   │       │   └── DTOs/
│   │   │       ├── Replenishment/
│   │   │       │   ├── ReorderPolicyService.cs
│   │   │       │   └── DTOs/
│   │   │       ├── Reporting/
│   │   │       │   ├── ReportService.cs          # raw SQL / EF projections for reports
│   │   │       │   └── DTOs/
│   │   │       └── Audit/
│   │   │           └── AuditService.cs           # writes AuditEvent rows
│   │   │
│   │   ├── Csw.Domain/                           # Pure domain — no framework deps
│   │   │   ├── Csw.Domain.csproj
│   │   │   └── Entities/
│   │   │       ├── User.cs
│   │   │       ├── Role.cs
│   │   │       ├── Item.cs
│   │   │       ├── ProductVariant.cs
│   │   │       ├── BomHeader.cs
│   │   │       ├── BomVersion.cs
│   │   │       ├── BomLine.cs
│   │   │       ├── InventoryTransaction.cs
│   │   │       ├── InventoryBalance.cs
│   │   │       └── AuditEvent.cs
│   │   │
│   │   └── Csw.Infrastructure/                   # EF Core, migrations, external concerns
│   │       ├── Csw.Infrastructure.csproj
│   │       ├── Data/
│   │       │   ├── AppDbContext.cs               # DbContext with all DbSets + model config
│   │       │   ├── Configurations/               # IEntityTypeConfiguration<T> per entity
│   │       │   └── Migrations/                   # EF Core generated migrations
│   │       │       └── 20240101000000_InitialSchema.cs
│   │       └── Jobs/                             # Hangfire background jobs
│   │           ├── BalanceRebuildJob.cs          # nightly ledger → balance rebuild
│   │           ├── ReportGenerationJob.cs        # async PDF/Excel generation
│   │           └── LowStockNotificationJob.cs    # low-stock alert (email/webhook)
│   │
│   └── tests/
│       ├── Csw.Application.Tests/
│       │   ├── Csw.Application.Tests.csproj
│       │   ├── Services/
│       │   │   ├── CodeGenerationServiceTests.cs
│       │   │   ├── LedgerServiceTests.cs
│       │   │   └── AvailabilityServiceTests.cs
│       │   └── Fixtures/
│       └── Csw.Api.Tests/
│           ├── Csw.Api.Tests.csproj
│           └── Controllers/                      # Integration tests via WebApplicationFactory
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── index.html
    ├── public/
    │   ├── manifest.json                # PWA manifest
    │   ├── favicon.ico
    │   └── icons/                       # PWA icon set (192, 512)
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── router.tsx                   # react-router-dom route definitions
        │
        ├── api/
        │   ├── client.ts                # axios instance with interceptors
        │   └── endpoints/
        │       ├── auth.ts
        │       ├── items.ts
        │       ├── products.ts
        │       ├── bom.ts
        │       ├── inventory.ts
        │       ├── availability.ts
        │       ├── reports.ts
        │       └── ...
        │
        ├── hooks/                       # custom React hooks (useItems, useBom, etc.)
        │
        ├── store/
        │   └── auth.ts                  # Zustand auth slice (JWT + user context)
        │
        ├── types/
        │   └── api.ts                   # TypeScript interfaces mirroring Pydantic schemas
        │
        ├── lib/
        │   ├── utils.ts                 # cn(), formatDate(), formatQty()
        │   └── constants.ts
        │
        ├── components/
        │   ├── ui/                      # shadcn/ui generated components
        │   ├── layout/
        │   │   ├── AppShell.tsx         # sidebar + topbar wrapper
        │   │   ├── Sidebar.tsx
        │   │   ├── Topbar.tsx
        │   │   └── MobileNav.tsx
        │   ├── shared/
        │   │   ├── DataTable.tsx        # TanStack Table wrapper
        │   │   ├── PageHeader.tsx
        │   │   ├── StatusBadge.tsx
        │   │   ├── ConfirmDialog.tsx
        │   │   ├── FormField.tsx
        │   │   ├── SearchInput.tsx
        │   │   ├── Pagination.tsx
        │   │   ├── ExportButton.tsx     # triggers CSV/Excel/PDF download
        │   │   └── EmptyState.tsx
        │   └── domain/
        │       ├── inventory/
        │       │   ├── TransactionForm.tsx
        │       │   └── StockBadge.tsx
        │       ├── bom/
        │       │   ├── BomLineEditor.tsx
        │       │   └── BomVersionSelector.tsx
        │       ├── availability/
        │       │   └── AvailabilityResultTable.tsx
        │       └── charts/
        │           ├── StockLevelChart.tsx
        │           └── MovementChart.tsx
        │
        └── pages/
            ├── auth/
            │   └── LoginPage.tsx
            ├── dashboard/
            │   └── DashboardPage.tsx
            ├── items/
            │   ├── ItemListPage.tsx
            │   ├── ItemDetailPage.tsx
            │   └── ItemFormPage.tsx
            ├── products/
            │   ├── ProductTypePage.tsx
            │   ├── ProductListPage.tsx
            │   ├── ProductVariantPage.tsx
            │   └── ProductVariantFormPage.tsx
            ├── item-coding/
            │   ├── CharacteristicTypePage.tsx
            │   ├── CharacteristicValuePage.tsx
            │   ├── CodeRulePage.tsx
            │   └── CodeGeneratorPage.tsx
            ├── bom/
            │   ├── BomListPage.tsx
            │   ├── BomDetailPage.tsx
            │   └── BomFormPage.tsx
            ├── inventory/
            │   ├── StockLedgerPage.tsx
            │   ├── ReceiptPage.tsx
            │   ├── ConsumptionPage.tsx
            │   ├── AdjustmentPage.tsx
            │   └── OpeningBalancePage.tsx
            ├── availability/
            │   └── AvailabilityCheckPage.tsx
            ├── replenishment/
            │   └── ReorderPoliciesPage.tsx
            ├── reports/
            │   ├── CurrentInventoryReport.tsx
            │   ├── LowStockReport.tsx
            │   ├── StockMovementReport.tsx
            │   ├── ProductRequirementsReport.tsx
            │   ├── MaterialRequirementsReport.tsx
            │   └── ItemUsageReport.tsx
            ├── admin/
            │   ├── UserListPage.tsx
            │   ├── UserFormPage.tsx
            │   ├── RolesPage.tsx
            │   └── AuditLogPage.tsx
            └── settings/
                ├── UnitsPage.tsx
                ├── SuppliersPage.tsx
                └── ProfilePage.tsx
```

---

## 4. Database Schema

All tables live in the `public` schema in PostgreSQL 16. Conventions:
- Primary keys: `UUID` generated with `gen_random_uuid()` (except `inventory_transactions` which also carries a monotonic `serial` for ledger ordering).
- `created_at` and `updated_at` columns on every table; `updated_at` managed by a trigger.
- Soft deletes (`is_active BOOLEAN DEFAULT TRUE`) on master-data tables so historical transactions retain references.
- `inventory_transactions` is append-only — no UPDATE or DELETE permitted (enforced via a PostgreSQL rule + application-layer constraint).

### 4.1 Identity & Access

```sql
-- roles
CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) UNIQUE NOT NULL,   -- ADMINISTRATOR, INVENTORY_USER, PRODUCTION_USER, MANAGEMENT_USER
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- users
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(100) UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user_roles  (many-to-many)
CREATE TABLE user_roles (
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id    UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);
```

### 4.2 Master Data — Units of Measure

```sql
CREATE TABLE units (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code         VARCHAR(20) UNIQUE NOT NULL,   -- KG, PCS, MTR, LTR, SET
    name         VARCHAR(100) NOT NULL,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.3 Master Data — Suppliers

```sql
CREATE TABLE suppliers (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code         VARCHAR(30) UNIQUE NOT NULL,
    name         VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone        VARCHAR(50),
    email        VARCHAR(255),
    address      TEXT,
    gstin        VARCHAR(20),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.4 Item Master (Raw Materials, Accessories, Packaging)

```sql
CREATE TABLE item_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(30) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    item_type   VARCHAR(30) NOT NULL CHECK (item_type IN ('RAW_MATERIAL','ACCESSORY','PACKAGING')),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code       VARCHAR(100) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    item_type       VARCHAR(30) NOT NULL CHECK (item_type IN ('RAW_MATERIAL','ACCESSORY','PACKAGING')),
    category_id     UUID REFERENCES item_categories(id),
    unit_id         UUID NOT NULL REFERENCES units(id),
    hsn_code        VARCHAR(20),
    min_stock_qty   NUMERIC(14,4) NOT NULL DEFAULT 0,
    max_stock_qty   NUMERIC(14,4),
    reorder_qty     NUMERIC(14,4),
    lead_time_days  INTEGER,
    notes           TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- preferred / approved supplier list per item
CREATE TABLE item_suppliers (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id        UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    supplier_id    UUID NOT NULL REFERENCES suppliers(id),
    supplier_code  VARCHAR(100),    -- supplier's own part number
    unit_price     NUMERIC(14,4),
    currency       VARCHAR(10) NOT NULL DEFAULT 'INR',
    lead_time_days INTEGER,
    is_preferred   BOOLEAN NOT NULL DEFAULT FALSE,
    valid_from     DATE,
    valid_to       DATE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (item_id, supplier_id)
);
```

### 4.5 Item Coding System

```sql
CREATE TABLE characteristic_types (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code           VARCHAR(50) UNIQUE NOT NULL,   -- PRODUCT_TYPE, MATERIAL, SIZE, LID_TYPE, FINISH, HANDLE
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    sort_order     INTEGER NOT NULL DEFAULT 0,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE characteristic_values (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    characteristic_type_id UUID NOT NULL REFERENCES characteristic_types(id) ON DELETE RESTRICT,
    code                  VARCHAR(50) NOT NULL,   -- TRI, SS, 14, 16, MIR, MAT, BC, DCL7
    name                  VARCHAR(100) NOT NULL,  -- Triply, Stainless Steel, Mirror, Matte, Black Cool
    sort_order            INTEGER NOT NULL DEFAULT 0,
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (characteristic_type_id, code)
);

-- code_masters stores segment-level metadata for the composite code
CREATE TABLE code_masters (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_name  VARCHAR(100) NOT NULL,           -- "ProductType", "Material", "Size", ...
    segment_order INTEGER NOT NULL,                -- position in the composite code
    separator     VARCHAR(10) NOT NULL DEFAULT '-', -- delimiter before this segment
    is_optional   BOOLEAN NOT NULL DEFAULT FALSE,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- rules define which characteristic_type feeds which code_master segment
CREATE TABLE code_generation_rules (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_master_id        UUID NOT NULL REFERENCES code_masters(id),
    characteristic_type_id UUID NOT NULL REFERENCES characteristic_types(id),
    rule_expression       TEXT,       -- optional regex/template override
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.6 Product Catalogue

```sql
CREATE TABLE product_types (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50) UNIQUE NOT NULL,   -- SAUCE_PAN, KADAI, FRY_PAN, CASSEROLE
    name        VARCHAR(100) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_type_id UUID NOT NULL REFERENCES product_types(id),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_variants (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id       UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_code     VARCHAR(150) UNIQUE NOT NULL,  -- the composite code e.g. SAUCE-TRI-14-DCL7-MIR-BC
    name             VARCHAR(255) NOT NULL,
    unit_id          UUID NOT NULL REFERENCES units(id),  -- finished-goods unit (PCS/SET)
    selling_price    NUMERIC(14,4),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- pivot: which characteristic_values define this variant
CREATE TABLE product_variant_characteristics (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_variant_id      UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    characteristic_type_id  UUID NOT NULL REFERENCES characteristic_types(id),
    characteristic_value_id UUID NOT NULL REFERENCES characteristic_values(id),
    UNIQUE (product_variant_id, characteristic_type_id)
);
```

### 4.7 Bill of Materials

```sql
CREATE TABLE bom_headers (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    current_version_id UUID,   -- FK set after first version is created (nullable bootstrap)
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    notes              TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_variant_id)
);

CREATE TABLE bom_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bom_header_id   UUID NOT NULL REFERENCES bom_headers(id) ON DELETE RESTRICT,
    version_number  INTEGER NOT NULL,                     -- auto-incremented per header
    status          VARCHAR(30) NOT NULL DEFAULT 'DRAFT'  -- DRAFT, ACTIVE, SUPERSEDED
                      CHECK (status IN ('DRAFT','ACTIVE','SUPERSEDED')),
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    created_by      UUID REFERENCES users(id),
    approved_by     UUID REFERENCES users(id),
    approved_at     TIMESTAMPTZ,
    change_reason   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (bom_header_id, version_number)
);

-- circular FK resolved: bom_headers.current_version_id references bom_versions
ALTER TABLE bom_headers ADD CONSTRAINT fk_current_version
    FOREIGN KEY (current_version_id) REFERENCES bom_versions(id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE bom_lines (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bom_version_id    UUID NOT NULL REFERENCES bom_versions(id) ON DELETE RESTRICT,
    line_number       INTEGER NOT NULL,
    item_id           UUID NOT NULL REFERENCES items(id),
    quantity          NUMERIC(14,6) NOT NULL CHECK (quantity > 0),
    unit_id           UUID NOT NULL REFERENCES units(id),
    waste_percent     NUMERIC(6,4) NOT NULL DEFAULT 0,  -- e.g. 2.5 means 2.5% scrap allowance
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (bom_version_id, line_number)
);
```

### 4.8 Inventory Ledger (Immutable)

```sql
-- transaction_types reference table
CREATE TABLE transaction_types (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50) UNIQUE NOT NULL,   -- OPENING_BALANCE, RECEIPT, CONSUMPTION, ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER_IN, TRANSFER_OUT
    name        VARCHAR(100) NOT NULL,
    sign        SMALLINT NOT NULL CHECK (sign IN (1,-1)),   -- +1 or -1 for balance effect
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- THE IMMUTABLE LEDGER
CREATE TABLE inventory_transactions (
    id                  UUID NOT NULL DEFAULT gen_random_uuid(),
    seq                 BIGSERIAL NOT NULL,          -- monotonic for ordering; never expose to updates
    item_id             UUID NOT NULL REFERENCES items(id),
    transaction_type_id UUID NOT NULL REFERENCES transaction_types(id),
    quantity            NUMERIC(14,4) NOT NULL CHECK (quantity > 0),  -- always positive; sign from transaction_type
    unit_id             UUID NOT NULL REFERENCES units(id),
    reference_doc       VARCHAR(100),       -- PO number, production order, GRN, etc.
    reference_doc_date  DATE,
    notes               TEXT,
    transaction_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    posted_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    posted_by           UUID NOT NULL REFERENCES users(id),
    idempotency_key     VARCHAR(255) UNIQUE,   -- prevents duplicate posts
    -- link back to BOM consumption
    bom_version_id      UUID REFERENCES bom_versions(id),
    product_variant_id  UUID REFERENCES product_variants(id),
    -- for corrections / adjustments, the original transaction
    reversal_of         UUID REFERENCES inventory_transactions(id),
    is_voided           BOOLEAN NOT NULL DEFAULT FALSE,  -- soft-void; balance still adjusted via reversal tx
    PRIMARY KEY (id)
);

-- immutability enforcement
CREATE RULE no_update_inventory_transactions AS ON UPDATE TO inventory_transactions DO INSTEAD NOTHING;
CREATE RULE no_delete_inventory_transactions AS ON DELETE TO inventory_transactions DO INSTEAD NOTHING;

-- performance indexes
CREATE INDEX idx_inv_tx_item_date      ON inventory_transactions(item_id, transaction_date);
CREATE INDEX idx_inv_tx_seq            ON inventory_transactions(seq);
CREATE INDEX idx_inv_tx_idempotency    ON inventory_transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_inv_tx_posted_at      ON inventory_transactions(posted_at DESC);
```

### 4.9 Inventory Balances (Materialised Cache)

```sql
-- one row per item; refreshed by trigger after each transaction insert
CREATE TABLE inventory_balances (
    item_id          UUID PRIMARY KEY REFERENCES items(id),
    quantity_on_hand NUMERIC(14,4) NOT NULL DEFAULT 0,
    quantity_reserved NUMERIC(14,4) NOT NULL DEFAULT 0,
    quantity_available NUMERIC(14,4) GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    last_transaction_seq BIGINT,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- trigger to keep inventory_balances in sync
CREATE OR REPLACE FUNCTION refresh_inventory_balance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_sign SMALLINT;
BEGIN
    SELECT sign INTO v_sign FROM transaction_types WHERE id = NEW.transaction_type_id;

    INSERT INTO inventory_balances (item_id, quantity_on_hand, last_transaction_seq, updated_at)
    VALUES (NEW.item_id, NEW.quantity * v_sign, NEW.seq, NOW())
    ON CONFLICT (item_id) DO UPDATE
        SET quantity_on_hand      = inventory_balances.quantity_on_hand + (NEW.quantity * v_sign),
            last_transaction_seq  = NEW.seq,
            updated_at            = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_refresh_balance
AFTER INSERT ON inventory_transactions
FOR EACH ROW EXECUTE FUNCTION refresh_inventory_balance();
```

### 4.10 Stock Reservations

```sql
CREATE TABLE stock_reservations (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id            UUID NOT NULL REFERENCES items(id),
    reserved_qty       NUMERIC(14,4) NOT NULL CHECK (reserved_qty > 0),
    reservation_ref    VARCHAR(100) NOT NULL,   -- production order / sales order ref
    reserved_by        UUID REFERENCES users(id),
    reserved_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at         TIMESTAMPTZ,
    released_at        TIMESTAMPTZ,
    status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                         CHECK (status IN ('ACTIVE','RELEASED','EXPIRED')),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.11 Reorder Policies

```sql
CREATE TABLE reorder_policies (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id          UUID NOT NULL REFERENCES items(id) UNIQUE,
    policy_type      VARCHAR(30) NOT NULL DEFAULT 'MIN_MAX'
                       CHECK (policy_type IN ('MIN_MAX','REORDER_POINT','PERIODIC')),
    reorder_point    NUMERIC(14,4),   -- trigger qty for REORDER_POINT policy
    min_stock_qty    NUMERIC(14,4),   -- for MIN_MAX
    max_stock_qty    NUMERIC(14,4),   -- for MIN_MAX
    reorder_qty      NUMERIC(14,4),   -- fixed order quantity
    review_period_days INTEGER,       -- for PERIODIC
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.12 Audit Events

```sql
CREATE TABLE audit_events (
    id           BIGSERIAL PRIMARY KEY,
    event_time   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id      UUID REFERENCES users(id),
    username     VARCHAR(100),        -- denormalised so log survives user deletion
    ip_address   VARCHAR(45),
    user_agent   TEXT,
    action       VARCHAR(100) NOT NULL,  -- USER_LOGIN, ITEM_CREATE, BOM_APPROVE, etc.
    entity_type  VARCHAR(100),
    entity_id    VARCHAR(255),
    old_values   JSONB,
    new_values   JSONB,
    request_id   VARCHAR(100),
    status       VARCHAR(20) NOT NULL DEFAULT 'SUCCESS'
                   CHECK (status IN ('SUCCESS','FAILURE'))
);

CREATE INDEX idx_audit_entity    ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_user      ON audit_events(user_id);
CREATE INDEX idx_audit_time      ON audit_events(event_time DESC);
```

---

## 5. API Endpoints

All endpoints are prefixed `/api/v1`. Authentication via `Authorization: Bearer <jwt>`. Role restrictions noted per group.

### 5.1 Auth — Identity Module

| Method | Path | Description | Roles |
|---|---|---|---|
| POST | `/auth/login` | Username + password → JWT + refresh token | Public |
| POST | `/auth/refresh` | Refresh token → new JWT | Authenticated |
| POST | `/auth/logout` | Invalidate refresh token | Authenticated |
| GET | `/auth/me` | Current user profile | Authenticated |
| PUT | `/auth/me/password` | Change own password | Authenticated |

### 5.2 Users & Roles — Identity Module

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/users` | Paginated user list | Admin |
| POST | `/users` | Create user | Admin |
| GET | `/users/{id}` | User detail | Admin |
| PUT | `/users/{id}` | Update user | Admin |
| DELETE | `/users/{id}` | Deactivate user | Admin |
| GET | `/roles` | All roles | Admin |
| POST | `/users/{id}/roles` | Assign role | Admin |
| DELETE | `/users/{id}/roles/{role_id}` | Remove role | Admin |

### 5.3 Units of Measure

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/units` | List all UoMs | All |
| POST | `/units` | Create UoM | Admin |
| PUT | `/units/{id}` | Update UoM | Admin |
| DELETE | `/units/{id}` | Deactivate UoM | Admin |

### 5.4 Suppliers

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/suppliers` | Paginated list (search, filter active) | Inventory, Admin |
| POST | `/suppliers` | Create supplier | Admin |
| GET | `/suppliers/{id}` | Supplier detail | Inventory, Admin |
| PUT | `/suppliers/{id}` | Update supplier | Admin |
| DELETE | `/suppliers/{id}` | Deactivate | Admin |

### 5.5 Item Categories

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/item-categories` | List by item_type | All |
| POST | `/item-categories` | Create | Admin |
| PUT | `/item-categories/{id}` | Update | Admin |

### 5.6 Items (Raw Material / Accessory / Packaging)

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/items` | Paginated + filter (item_type, category, search, low_stock) | All |
| POST | `/items` | Create item | Admin, Inventory |
| GET | `/items/{id}` | Item detail + current balance | All |
| PUT | `/items/{id}` | Update item | Admin, Inventory |
| DELETE | `/items/{id}` | Deactivate | Admin |
| GET | `/items/{id}/transactions` | Transaction history (paginated + date range) | All |
| GET | `/items/{id}/suppliers` | Approved supplier list | All |
| POST | `/items/{id}/suppliers` | Add supplier | Admin, Inventory |
| PUT | `/items/{id}/suppliers/{sup_id}` | Update supplier terms | Admin, Inventory |
| DELETE | `/items/{id}/suppliers/{sup_id}` | Remove supplier | Admin |

### 5.7 Item Coding — Characteristic Types & Values

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/characteristic-types` | All types (ordered) | All |
| POST | `/characteristic-types` | Create | Admin |
| PUT | `/characteristic-types/{id}` | Update | Admin |
| GET | `/characteristic-types/{id}/values` | Values for type | All |
| POST | `/characteristic-types/{id}/values` | Add value | Admin |
| PUT | `/characteristic-values/{id}` | Update value | Admin |
| DELETE | `/characteristic-values/{id}` | Deactivate value | Admin |

### 5.8 Code Masters & Rules

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/code-masters` | Ordered segment list | Admin |
| POST | `/code-masters` | Create segment | Admin |
| PUT | `/code-masters/{id}` | Update | Admin |
| GET | `/code-rules` | All rules | Admin |
| POST | `/code-rules` | Create rule | Admin |
| PUT | `/code-rules/{id}` | Update rule | Admin |
| POST | `/generate-code` | Preview composite code from selections | Admin, Inventory |

### 5.9 Product Types & Products

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/product-types` | All types | All |
| POST | `/product-types` | Create | Admin |
| GET | `/products` | Paginated + filter by type | All |
| POST | `/products` | Create | Admin |
| GET | `/products/{id}` | Product + variants | All |
| PUT | `/products/{id}` | Update | Admin |

### 5.10 Product Variants

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/product-variants` | Paginated + filter (product, active) | All |
| POST | `/product-variants` | Create variant (triggers code generation) | Admin |
| GET | `/product-variants/{id}` | Variant detail + characteristics | All |
| PUT | `/product-variants/{id}` | Update | Admin |
| DELETE | `/product-variants/{id}` | Deactivate | Admin |

### 5.11 BOM

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/boms` | List BOM headers (filter by product_variant) | All |
| POST | `/boms` | Create BOM header | Admin, Inventory |
| GET | `/boms/{id}` | BOM header + current version + lines | All |
| GET | `/boms/{id}/versions` | All versions | All |
| POST | `/boms/{id}/versions` | Create new draft version | Admin, Inventory |
| GET | `/boms/{id}/versions/{ver_id}` | Specific version + lines | All |
| PUT | `/boms/{id}/versions/{ver_id}` | Update draft (add/remove/edit lines) | Admin, Inventory |
| POST | `/boms/{id}/versions/{ver_id}/activate` | Approve and activate version | Admin |
| POST | `/boms/{id}/versions/{ver_id}/lines` | Add BOM line | Admin, Inventory |
| PUT | `/boms/{id}/versions/{ver_id}/lines/{line_id}` | Update line | Admin, Inventory |
| DELETE | `/boms/{id}/versions/{ver_id}/lines/{line_id}` | Remove line (DRAFT only) | Admin, Inventory |

### 5.12 Inventory Ledger

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/inventory/balances` | All items with current balance (+ low stock flag) | All |
| GET | `/inventory/balances/{item_id}` | Single item balance | All |
| POST | `/inventory/transactions/receipt` | Post goods receipt | Inventory, Admin |
| POST | `/inventory/transactions/consumption` | Post material consumption | Production, Inventory, Admin |
| POST | `/inventory/transactions/adjustment` | Post stock adjustment | Inventory, Admin |
| POST | `/inventory/transactions/opening-balance` | Post opening balance (once per item) | Admin |
| GET | `/inventory/transactions` | Transaction ledger (paginated + filters: item, type, date range, reference) | All |
| GET | `/inventory/transactions/{id}` | Single transaction detail | All |
| POST | `/inventory/transactions/{id}/void` | Void via reversal transaction | Admin |

All POST endpoints for stock transactions accept an `Idempotency-Key` header.

### 5.13 Product Availability Check

| Method | Path | Description | Roles |
|---|---|---|---|
| POST | `/availability/check` | Check qty for one product variant | All |
| POST | `/availability/check-bulk` | Check multiple variants at once | All |

Request body for `/availability/check`:
```json
{ "product_variant_id": "uuid", "quantity": 50 }
```

Response:
```json
{
  "product_variant_id": "uuid",
  "variant_code": "SAUCE-TRI-14-DCL7-MIR-BC",
  "requested_qty": 50,
  "is_fulfillable": false,
  "components": [
    {
      "item_id": "uuid",
      "item_code": "SS-BODY-14",
      "item_name": "SS Body 14cm",
      "required_qty": 50.0,
      "on_hand_qty": 45.0,
      "available_qty": 45.0,
      "shortage_qty": 5.0,
      "status": "SHORT"
    }
  ]
}
```

### 5.14 Reorder Policies

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/reorder-policies` | All policies | Admin, Inventory |
| POST | `/reorder-policies` | Create policy | Admin |
| PUT | `/reorder-policies/{id}` | Update | Admin |
| DELETE | `/reorder-policies/{id}` | Deactivate | Admin |
| GET | `/replenishment/alerts` | Items below reorder point | All |

### 5.15 Reports

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/reports/current-inventory` | Current stock of all items (CSV/XLSX/PDF) | All |
| GET | `/reports/low-stock` | Items at or below min stock | All |
| GET | `/reports/stock-movement` | Transactions in date range | All |
| GET | `/reports/product-requirements` | Materials needed for product qty | Production, Management |
| GET | `/reports/material-requirements` | Aggregate demand across variants | Production, Management |
| GET | `/reports/item-usage` | Consumption history per item | All |
| GET | `/reports/audit-log` | Audit events (filterable) | Admin |

All report endpoints accept `?format=json|csv|xlsx|pdf` query param. Large reports are triggered asynchronously via a Hangfire background job; the endpoint enqueues the job and returns a task ID; the client polls `/reports/tasks/{task_id}` until the job completes.

### 5.16 Dashboard

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/dashboard/summary` | KPI cards (item counts, low-stock count, today's transactions) | All |
| GET | `/dashboard/recent-transactions` | Last 10 transactions | All |
| GET | `/dashboard/stock-health` | % items in OK / LOW / OUT state | All |

### 5.17 Audit

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/audit/events` | Paginated audit log (filter: user, action, entity, date) | Admin |
| GET | `/audit/events/{id}` | Single event detail | Admin |

---

## 6. Frontend Pages & Components

### 6.1 Page Inventory

| Page | Route | Description | Accessible To |
|---|---|---|---|
| Login | `/login` | Username/password form | Public |
| Dashboard | `/` | KPI cards, charts, recent activity, low-stock alert strip | All |
| Items — List | `/items` | Searchable/filterable table, grouped by type tab | All |
| Items — New / Edit | `/items/new`, `/items/:id/edit` | Item form | Admin, Inventory |
| Items — Detail | `/items/:id` | Balance card + transaction history table | All |
| Suppliers — List | `/suppliers` | Paginated table | All |
| Suppliers — Form | `/suppliers/new`, `/suppliers/:id/edit` | Supplier form | Admin |
| Characteristic Types | `/settings/characteristic-types` | CRUD table | Admin |
| Characteristic Values | `/settings/characteristic-types/:id/values` | Value editor | Admin |
| Code Rules | `/settings/code-rules` | Segment/rule editor | Admin |
| Code Generator | `/settings/code-generator` | Interactive code preview tool | Admin |
| Product Types | `/settings/product-types` | Simple CRUD | Admin |
| Products — List | `/products` | Filterable table | All |
| Products — Form | `/products/new`, `/products/:id/edit` | Product form | Admin |
| Product Variants — List | `/products/:id/variants` | Variants for a product | All |
| Product Variant — Form | `/products/:id/variants/new`, `.../variants/:vid/edit` | Characteristic picker → code preview → save | Admin |
| BOM — List | `/boms` | BOM headers table | All |
| BOM — Detail / Edit | `/boms/:id` | Version selector + line editor | Admin, Inventory |
| BOM — Version Diff | `/boms/:id/versions/:vid/diff` | Side-by-side version comparison | All |
| Stock Ledger | `/inventory/ledger` | Full transaction log with filters | All |
| Receipt Entry | `/inventory/receipt` | Post goods receipt form | Inventory, Admin |
| Consumption Entry | `/inventory/consumption` | Production consumption form (BOM-assisted) | Production, Inventory, Admin |
| Adjustment Entry | `/inventory/adjustment` | Stock adjustment form | Inventory, Admin |
| Opening Balance | `/inventory/opening-balance` | One-time opening balance import | Admin |
| Availability Check | `/availability` | Variant + qty → component status table | All |
| Reorder Policies | `/replenishment/policies` | CRUD table | Admin |
| Replenishment Alerts | `/replenishment/alerts` | Items needing replenishment | All |
| Report: Current Inventory | `/reports/current-inventory` | Interactive table + export | All |
| Report: Low Stock | `/reports/low-stock` | Filtered table + export | All |
| Report: Stock Movement | `/reports/stock-movement` | Date-range picker + table + chart | All |
| Report: Product Requirements | `/reports/product-requirements` | Variant + qty form → requirements table | Production, Mgmt |
| Report: Material Requirements | `/reports/material-requirements` | Aggregate MRP-lite view | Production, Mgmt |
| Report: Item Usage | `/reports/item-usage` | Item + date range → usage chart + table | All |
| User Management | `/admin/users` | User list + role assignment | Admin |
| Audit Log | `/admin/audit` | Filterable audit trail | Admin |
| Units of Measure | `/settings/units` | CRUD | Admin |
| Profile | `/settings/profile` | Own profile + password change | All |
| 404 / Unauthorized | — | Error pages | — |

### 6.2 Key Shared Components

**Layout**
- `AppShell` — responsive sidebar (collapses to bottom nav on mobile), top bar with user menu and notification bell
- `Sidebar` — role-filtered nav links, grouped by module
- `Topbar` — breadcrumb + user avatar + low-stock alert count badge
- `MobileNav` — bottom tab bar for 5 primary pages on small screens

**Data Display**
- `DataTable` — TanStack Table v8; column visibility toggle, sort, server-side pagination, row selection
- `StatusBadge` — colour-coded chip: `OK / LOW / OUT / DRAFT / ACTIVE / SUPERSEDED`
- `StockBadge` — inline qty + unit display with colour coding
- `KpiCard` — number + label + trend indicator for dashboard
- `EmptyState` — icon + message + optional action button

**Forms**
- `FormField` — label + input/select/textarea + error message wrapper
- `SearchInput` — debounced search with clear button
- `DateRangePicker` — two-date selector for report filters
- `ItemSelector` — async autocomplete for item search
- `VariantSelector` — async autocomplete for product variant search
- `UnitSelector` — select from cached units list
- `SupplierSelector` — async autocomplete
- `ConfirmDialog` — modal for destructive actions

**BOM-Specific**
- `BomLineEditor` — inline editable table row (item, qty, unit, waste%)
- `BomVersionSelector` — version dropdown with status badges
- `BomVersionDiff` — side-by-side two-column diff of bom lines

**Availability**
- `AvailabilityResultTable` — component status table with SHORT rows highlighted in red, OK in green

**Charts** (Recharts)
- `StockLevelChart` — horizontal bar chart of on-hand vs. min stock per item category
- `StockMovementChart` — time-series of receipts vs. consumption
- `CategoryDonut` — breakdown of items by type

---

## 7. Phased Build Plan

### Phase 1 — Core Foundation (Weeks 1–8)
*Goal: The system is usable for daily inventory tracking. Users can receive stock, consume it, and see balances.*

**Week 1–2: Project Setup**
- Initialise repo, Docker Compose stack (PostgreSQL, backend, frontend, Nginx)
- Backend project scaffold: ASP.NET Core 8 solution, EF Core DbContext, Hangfire, JWT auth, Swagger middleware
- Alembic migration 0001: all Phase-1 tables (users, roles, user_roles, units, suppliers, item_categories, items, item_suppliers, transaction_types, inventory_transactions, inventory_balances, audit_events)
- Seed data: 4 roles, default admin user, standard transaction types, base units (KG, PCS, MTR, LTR, SET)
- Frontend scaffold: Vite + React + Tailwind + shadcn/ui + React Router + React Query
- Login page + JWT auth flow (access token in memory, refresh token in httpOnly cookie)
- AppShell with sidebar

**Week 3–4: Master Data**
- Units CRUD (API + pages)
- Suppliers CRUD (API + pages)
- Item Categories CRUD (API + pages)
- Items CRUD — all three types (API + pages + detail page with balance card)
- Item-Supplier association (API + inline table on Item Detail page)
- User management + role assignment (API + Admin pages)

**Week 5–6: Inventory Ledger**
- Transaction types seeded
- Opening Balance entry (one-time per item, Admin only)
- Goods Receipt entry form
- Material Consumption entry form
- Stock Adjustment entry form
- Void transaction (creates reversal) endpoint + UI
- Idempotency key implementation (Redis store with TTL)
- Stock Ledger view (paginated, filterable)
- `inventory_balances` trigger verified in integration tests

**Week 7–8: Reports + Dashboard**
- Dashboard KPI cards: total items, low-stock count, today's receipts, today's consumption
- Low Stock Report (items below min_stock_qty)
- Current Inventory Report (all items + balance + unit)
- Stock Movement Report (date range)
- CSV and Excel export for all reports
- Profile page + password change
- Audit event capture for all write endpoints
- Audit Log page (Admin)
- End-to-end testing of full ledger lifecycle

**Phase 1 Deliverables:**
- Working Docker Compose deployment
- Admin can set up items and suppliers
- Inventory user can post receipts, consumption, adjustments
- Management can view stock levels and movement reports
- All actions audited

---

### Phase 2 — BOM + Product Catalogue + Availability (Weeks 9–16)
*Goal: The system manages the full product hierarchy, BOMs, and can answer "can we make X units of product Y?"*

**Week 9–10: Item Coding System**
- Migrations for characteristic_types, characteristic_values, code_masters, code_generation_rules
- Characteristic Types + Values CRUD (API + Admin pages)
- Code Masters + Rules CRUD (API + Admin pages)
- Code generation algorithm (service layer): assemble composite code from ordered segments
- Interactive Code Generator preview page
- Validation: no duplicate codes, inactive values rejected

**Week 11–12: Product Catalogue**
- Migrations for product_types, products, product_variants, product_variant_characteristics
- Product Types CRUD
- Products CRUD
- Product Variants form: characteristic picker → live code preview → save
- `variant_code` uniqueness enforced at DB + service layers

**Week 13–14: Bill of Materials**
- Migrations for bom_headers, bom_versions, bom_lines
- BOM Header creation (one per variant)
- BOM Version creation (DRAFT)
- BOM Line editor (inline add/edit/remove)
- Activate version workflow (status DRAFT → ACTIVE; previous ACTIVE → SUPERSEDED; bom_headers.current_version_id updated atomically)
- BOM Version history list
- BOM Version Diff view
- PDF export of BOM

**Week 15–16: Product Availability Check**
- Availability check service: given variant + qty, explode BOM, multiply quantities (including waste%), compare to inventory_balances, return SHORT/OK per line
- Availability Check page (variant selector + qty input → result table)
- Bulk availability check API
- Product Requirements report (what materials needed for qty of a variant)
- Material Requirements report (aggregate across multiple variants)
- BOM-assisted Consumption entry (select variant + qty → auto-populate consumption lines from active BOM, editable before posting)
- Stock Reservation endpoints + UI

---

### Phase 3 — Advanced Features (Weeks 17+)
*Goal: System becomes proactive; adds replenishment intelligence, advanced analytics, and operational conveniences.*

**Replenishment Intelligence**
- Reorder Policies CRUD
- Replenishment Alerts page (items below reorder point)
- Hangfire recurring job: nightly alert evaluation + optional email/webhook notification
- Purchase Requirement generation (suggest PO quantities based on policy)

**Advanced Reports**
- Item Usage Report with trend chart
- Pareto analysis (80/20 by consumption value)
- BOM-based cost estimation (material cost per unit)
- PDF-formatted reports (QuestPDF)
- Async report generation for large datasets (Hangfire jobs + polling)

**Data Quality & Operations**
- Bulk item import via Excel upload (validate, preview, confirm)
- Bulk BOM import from CSV template
- Opening Balance bulk import
- Nightly balance rebuild job (Hangfire `BalanceRebuildJob`; recalculates balances from full ledger — safety net)

**User Experience Enhancements**
- PWA offline capability (service worker caches master data for read access)
- Push notifications for low-stock alerts (Web Push API via service worker)
- Keyboard shortcuts for common data entry flows
- Recent transactions widget with infinite scroll

**Integration Readiness**
- Webhook outbound events for low-stock and new-transaction (configurable endpoints)
- API key authentication as alternative to JWT for machine-to-machine clients
- Full OpenAPI 3.1 spec export and Redoc documentation page

**Infrastructure**
- Automated pg_dump backup job to NAS share via the backup container
- Health check endpoints (`/health/live`, `/health/ready`) for monitoring
- Prometheus metrics endpoint on backend (`/metrics`) for optional Grafana dashboard
- Log aggregation via structured JSON logs (backend) + Loki-compatible shipping

---

## 8. Docker Compose Setup

```yaml
# docker-compose.yml

version: "3.9"

services:

  postgres:
    image: postgres:16-alpine
    container_name: csw_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - internal

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: csw_backend
    restart: unless-stopped
    environment:
      ConnectionStrings__Default: Host=postgres;Port=5432;Database=${DB_NAME};Username=${DB_USER};Password=${DB_PASSWORD}
      Jwt__SecretKey: ${SECRET_KEY}
      Jwt__Issuer: csw-inventory
      Jwt__Audience: csw-inventory
      AllowedOrigins: ${ALLOWED_ORIGINS}
      ASPNETCORE_ENVIRONMENT: Production
      ASPNETCORE_URLS: http://+:8080
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - internal
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health/live"]
      interval: 15s
      timeout: 5s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: csw_frontend
    restart: unless-stopped
    networks:
      - internal

  nginx:
    image: nginx:1.27-alpine
    container_name: csw_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    networks:
      - internal
      - external

  backup:
    build:
      context: ./backup
    container_name: csw_backup
    restart: unless-stopped
    environment:
      PGHOST: postgres
      PGUSER: ${DB_USER}
      PGPASSWORD: ${DB_PASSWORD}
      PGDATABASE: ${DB_NAME}
      BACKUP_DEST: ${BACKUP_DEST_PATH}   # e.g. /mnt/nas/csw-backups
    volumes:
      - ${NAS_MOUNT_PATH}:/mnt/nas
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - internal

volumes:
  postgres_data:

networks:
  internal:
    driver: bridge
  external:
    driver: bridge
```

**Nginx routing rules (nginx.conf sketch):**
- `GET /api/*` → proxy to `backend:8080`
- `GET /swagger*`, `GET /health/*` → proxy to `backend:8080` (Swashbuckle UI — disable in production if desired)
- Everything else → proxy to `frontend:80` (Vite static build served by Nginx inside the frontend container)
- WebSocket upgrade headers for future use

**.env.example:**
```
DB_NAME=csw_inventory
DB_USER=csw_app
DB_PASSWORD=change_me_strong_password
SECRET_KEY=change_me_64_char_hex_string
ALLOWED_ORIGINS=http://localhost,https://192.168.1.100
BACKUP_DEST_PATH=/mnt/nas/csw-backups
NAS_MOUNT_PATH=//192.168.1.200/backups
```

---

## 9. Key Implementation Notes

### 9.1 Immutable Ledger Pattern

The `inventory_transactions` table is the single source of truth for all stock movements. The pattern works as follows:

1. Every stock change — receipt, consumption, adjustment — creates a new row. No UPDATE or DELETE is ever executed on this table. The PostgreSQL `RULE` blocks any such attempt at the DB engine level, providing a hard guarantee even if application code has a bug.

2. The `transaction_type.sign` column (+1 or -1) drives the balance effect. The `quantity` column is always stored as a positive number. This avoids ambiguity: a CONSUMPTION of 10 KG is stored as `quantity=10`, `sign=-1`.

3. `inventory_balances` is a materialised-cache table updated by a trigger after each insert. It is the O(1) read path for current stock levels. It can be fully rebuilt from scratch by summing all transactions for each item — this is the nightly `BalanceRebuildJob` scheduled via Hangfire.

4. To void a transaction (e.g., incorrect receipt), the system creates a second "reversal" transaction with the opposite sign (e.g., if the original was RECEIPT, the reversal is ADJUSTMENT_OUT) and sets `reversal_of = original_tx_id` and `is_voided = TRUE` on the original. The balance trigger fires on the reversal, cancelling the effect. Neither row is ever deleted.

5. The `idempotency_key` (UUID v4 generated by the client) stored in Redis for 24 hours prevents a form double-submit or network retry from posting a duplicate transaction. The server checks Redis before inserting; if the key exists, it returns the original response.

### 9.2 Item Code Generation Algorithm

The composite code (e.g., `SAUCE-TRI-14-DCL7-MIR-BC`) is assembled by the `item_coding.service.generate_code()` function:

```
Input: dict mapping characteristic_type_id → characteristic_value_id
Output: string (the composite code)

Algorithm:
1. Load code_masters ordered by segment_order.
2. For each segment, find the code_generation_rule where code_master_id = segment.id.
3. From that rule, get the characteristic_type_id.
4. Look up the selected characteristic_value for that type in the input dict.
5. If found, append separator + characteristic_value.code to the output buffer.
6. If not found and segment.is_optional = FALSE, raise ValidationError.
7. If not found and segment.is_optional = TRUE, skip segment.
8. Return the assembled string (strip leading separator).
```

The algorithm is deterministic and is called both in the `POST /generate-code` preview endpoint and in `POST /product-variants` before saving. The generated code is stored in `product_variants.variant_code` and treated as immutable thereafter (any characteristic change requires creating a new variant).

### 9.3 BOM Versioning

The BOM versioning model follows an optimistic draft-activate lifecycle:

- A `bom_header` is created once per `product_variant` (1:1).
- Multiple `bom_versions` can exist but only one can be `ACTIVE` at a time.
- New versions are created as `DRAFT`. Lines are added/edited/removed freely while in DRAFT.
- Activating a version:
  1. Begin a database transaction.
  2. Set the current `ACTIVE` version (if any) to `SUPERSEDED` and set its `effective_to = TODAY`.
  3. Set the new version's `status = ACTIVE` and `effective_from = TODAY`.
  4. Update `bom_headers.current_version_id = new_version.id`.
  5. Commit.
- Consumption and availability checks always use `bom_headers.current_version_id` unless the caller explicitly passes a `bom_version_id`.
- Historical production consumption records retain the `bom_version_id` at the time of posting, so cost and requirement recalculations are always accurate.

### 9.4 Availability Check Algorithm

The availability check service (`availability.service.check_availability()`) runs as follows:

```
Input: product_variant_id, requested_quantity
Output: AvailabilityResult (is_fulfillable, list of ComponentResult)

Algorithm:
1. Load product_variant → bom_header → current bom_version.
2. If no ACTIVE bom_version exists, raise BusinessError("No active BOM for variant").
3. For each bom_line in active version:
   a. net_qty_required = bom_line.quantity * requested_quantity
   b. gross_qty_required = net_qty_required * (1 + bom_line.waste_percent / 100)
   c. Load inventory_balances.quantity_available for bom_line.item_id.
   d. shortage = max(0, gross_qty_required - quantity_available)
   e. status = "SHORT" if shortage > 0 else "OK"
   f. Append ComponentResult to list.
4. is_fulfillable = all(c.status == "OK" for c in components)
5. Return AvailabilityResult.
```

The check is a pure read operation — it never modifies `inventory_balances` or creates reservations. A separate `POST /inventory/reserve` endpoint handles optional reservation creation. The algorithm runs in a single database round-trip using a single SQL query that joins `bom_lines → items → inventory_balances` for a given `bom_version_id`.

### 9.5 Transaction Date vs. Posted-At

`transaction_date` (DATE) is the business date of the stock movement (e.g., the date a shipment was physically received). `posted_at` (TIMESTAMPTZ) is when the entry was recorded in the system. This separation allows backdating adjustments and opening balances correctly while still maintaining an accurate audit timestamp. Reports that need accurate period stock can filter by `transaction_date`; the audit log always shows `posted_at`.

### 9.6 Role Enforcement Pattern

On the backend, role enforcement uses ASP.NET Core's built-in policy-based authorization. Roles are embedded in the JWT claims at login and validated server-side on every request.

```csharp
// Program.cs — policy registration
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("InventoryOrAdmin", policy =>
        policy.RequireRole("Administrator", "InventoryUser"));
});

// InventoryController.cs — controller usage
[ApiController]
[Route("api/v1/inventory")]
[Authorize]
public class InventoryController : ControllerBase
{
    [HttpPost("transactions/adjustment")]
    [Authorize(Policy = "InventoryOrAdmin")]
    public async Task<IActionResult> PostAdjustment(
        [FromBody] AdjustmentCreateDto dto,
        CancellationToken ct)
    {
        // idempotency check, then service call
    }
}
```

The JWT payload includes a `roles` claim array. `[Authorize(Roles = "...")]` or named policies both work — policies are preferred for multi-role combinations. On the frontend, `router.tsx` wraps protected routes in a `<RoleGuard allowedRoles={[...]} />` component that redirects to `/unauthorized` if the decoded JWT roles do not match. This is a UX convenience — the backend is the authoritative enforcement point.

---

### Critical Files for Implementation

- `backend/src/Csw.Api/Program.cs` — application entry point; registers all services, EF Core, Hangfire, JWT auth, Swagger, and the middleware pipeline
- `backend/src/Csw.Infrastructure/Data/AppDbContext.cs` — EF Core DbContext with all DbSets and fluent model configuration; defines the complete database surface
- `backend/src/Csw.Infrastructure/Data/Migrations/` — EF Core migrations; the first migration must create all tables in dependency order and seed transaction types, roles, and a default admin user
- `backend/src/Csw.Application/Services/Inventory/LedgerService.cs` — the ledger posting service; wraps every stock transaction in a database transaction that inserts an `InventoryTransaction` row and updates `InventoryBalance` atomically
- `backend/src/Csw.Application/Services/Availability/AvailabilityService.cs` — the availability check algorithm; the business-critical query that joins BOM lines to live balances
- `docker-compose.yml` — the single file that orchestrates the entire deployment; correctness here determines whether the system runs at all on the Windows factory PC