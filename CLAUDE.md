# CSW Inventory Management System — Claude Instructions

## Project Overview
Cookware manufacturer inventory management system. Docker Compose stack on a local factory network Windows PC.
Stack: ASP.NET Core 8 + EF Core 8 + PostgreSQL 16 + React 18 + Vite + Tailwind CSS v3.

## Key Reference Files
Read these files for high-level understanding before making significant changes:

- **`.claude/plan.md`** — Full implementation plan: tech stack, database schema, API endpoints, frontend pages, phased build plan, and key implementation notes (immutable ledger, BOM versioning, availability algorithm, code generation algorithm). This is the single source of truth for what the system should do.
- **`.claude/inventory_management_business_requirements-2.md`** — Business requirements document.
- **`.claude/inventory_management_technical_architecture.md`** — Technical architecture document.

## Implementation Status
**`.claude/implementation-status.md`** tracks what has been built vs. what remains.

> **Keep `implementation-status.md` updated as you implement features.** When a feature is completed, check it off. When starting something new, mark it in-progress. When the phase tracking table at the bottom changes, update it. Do not let this file go stale.

## Project Structure
```
backend/src/Csw.Api/
  Controllers/      — ASP.NET Core controllers
  Application/
    Services/       — business logic
    DTOs/           — request/response objects
  Domain/Entities/  — EF Core entity classes
  Infrastructure/Data/
    AppDbContext.cs       — EF Core DbContext (all DbSets + model config)
    DbInitializer.cs      — seed data on startup

frontend/src/
  api/              — Axios API functions per domain
  pages/            — React page components
  components/       — shared + layout components
  store/            — Zustand stores
  types/            — TypeScript types
```

## Conventions
- New feature pattern: entity → DbSet in AppDbContext → service → DTO → controller → frontend api file → page component.
- Seeded credentials: `admin@csw.local` / `Admin@123` (Administrator), `inventory@csw.local` / `Inventory@123` (InventoryUser).
- JWT claim for user ID: `ClaimTypes.NameIdentifier` (ASP.NET Core maps `sub` → NameIdentifier).
- Enums stored as strings in DB (`.HasConversion<string>()`).
- `EnsureCreated()` used instead of formal EF Core migrations (MVP speed; migrate before production).

## Resume Instructions
To resume Phase 2 implementation: read `.claude/implementation-status.md` for current state, then continue from the first unchecked item in Phase 2 scope (Characteristic Types/Values, Code Masters, Products, Variants, BOM, Availability Check).
