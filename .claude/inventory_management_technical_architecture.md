# Inventory Management System - Technical Architecture

## 1. Architecture Style

Use a **modular monolith** for the initial release. The application is deployed as one backend service but separated internally into well-defined business modules.

Recommended modules:

- Identity and Access
- Master Data
- Product Catalogue
- Item Coding
- Bill of Materials
- Inventory Ledger
- Product Availability
- Replenishment
- Reporting
- Audit and Activity

Each module should own its validation rules, application services and data access logic. Module boundaries should be maintained so selected modules can be extracted into independent services later if necessary.

## 2. High-Level Architecture

```text
Mobile / Tablet / Desktop Browser
                |
        Responsive Web UI
                |
        Backend Application API
                |
  +-------------+--------------+
  |             |              |
Identity     Business       Reporting and
and Access   Modules        Background Jobs
                |
          PostgreSQL Database
                |
       Backups and Audit Logs
```

## 3. Early-Adoption Deployment

The initial system can run on one dedicated PC connected to the factory's local network.

```text
Factory Local Network
         |
Windows PC with Fixed Local IP
         |
Docker Desktop and Docker Compose
   |         |          |
Web App   Backend API   Background Worker
                         |
                  PostgreSQL Database
                         |
                  External Backups
```

The host PC should be treated as a small server rather than used as a normal employee workstation.

### Recommended Pilot Hardware

- Modern Intel Core i5, AMD Ryzen 5 or better
- 16 GB RAM
- 256 GB or larger SSD
- Windows 11 Pro
- Reliable wired network connection
- UPS for protection against power interruptions
- External drive or separate network device for backups

### Local Access

On the host PC:

```text
http://localhost
```

From another authorised device on the same local network:

```text
http://<host-pc-local-ip>
```

The host PC should use a fixed local IP address. Local firewall rules should allow access only from trusted network ranges. HTTPS should be configured before real operational data is entered.

## 4. Container Structure

Use Docker Compose to define and operate the local environment.

Recommended containers:

```text
reverse-proxy
web-frontend
backend-api
background-worker
postgresql
backup-job
```

Persistent Docker volumes should be used for database storage and generated files. Database backups must also be copied outside the host PC.

## 5. Frontend

Build a responsive Progressive Web App suitable for desktop and factory-floor mobile use.

Recommended frontend areas:

- Dashboard
- Products and Product Variants
- Raw Materials
- Accessories
- Packaging Materials
- Bill of Materials
- Stock Receipts
- Stock Consumption
- Stock Adjustments
- Product Availability Check
- Inventory Enquiry
- Reports
- User and System Administration

For mobile workflows, use large controls, minimal typing, item-code search, clear validation messages and short transaction forms.

## 6. Backend API

Expose versioned REST APIs.

```text
/api/v1/products
/api/v1/product-variants
/api/v1/items
/api/v1/accessories
/api/v1/packaging-items
/api/v1/boms
/api/v1/inventory/receipts
/api/v1/inventory/consumptions
/api/v1/inventory/adjustments
/api/v1/inventory/balances
/api/v1/availability/check
/api/v1/reports/stock-movement
```

Stock-posting endpoints should accept an idempotency key to prevent duplicate transactions caused by retries or repeated submissions.

## 7. Master Data Module

The Master Data module should manage:

- Units of measurement
- Product types
- Materials
- Sizes
- Finishes
- Base types
- Lid types
- Accessory types
- Packaging types
- Suppliers

Referenced master records should be deactivated rather than physically deleted.

## 8. Product Catalogue Module

The product model should distinguish between:

- Product type or family
- Product variant
- Variant characteristics
- Finished-product business code

Use an internal immutable UUID or numeric identifier as the database primary key. Store the human-readable item code separately as a unique business identifier.

## 9. Item Coding Module

The coding module should:

1. Read selected product characteristics.
2. Validate mandatory code segments.
3. Apply the configured segment order.
4. Apply the configured separator.
5. Generate the finished-product code.
6. Validate code uniqueness.
7. Prevent duplicate variants with the same characteristic combination.

Code masters should support:

- Product type codes
- Material codes
- Size codes
- Handle and accessory codes
- Inside-finish codes
- Outside-finish codes
- Base codes
- Lid codes
- Packaging codes

Codes should remain stable after being referenced by inventory transactions.

## 10. Bill of Materials Module

Use a versioned Bill of Materials structure.

```text
Product Variant
    |
    +-- BOM
          |
          +-- BOM Version
                  |
                  +-- Raw Material Line
                  +-- Accessory Line
                  +-- Packaging Line
```

Each BOM line should contain:

- Component item identifier
- Component category
- Quantity per finished unit
- Unit of measurement
- Variant or specification reference
- Notes
- Effective status

Previously used BOM versions should remain available for historical traceability.

## 11. Inventory Ledger

Use an immutable transaction ledger as the authoritative source of stock information. Do not store inventory solely as an editable current-quantity field.

Suggested transaction structure:

```text
InventoryTransaction
- Transaction ID
- Item ID
- Transaction Type
- Quantity In
- Quantity Out
- Unit of Measurement
- Transaction Date and Time
- Reference Type
- Reference ID
- Reason
- Performed By
- Created Timestamp
```

Initial transaction types:

- Opening Balance
- Receipt
- Consumption
- Positive Adjustment
- Negative Adjustment

Balance calculation:

```text
Available Stock =
    Opening Balance
  + Receipts
  + Positive Adjustments
  - Consumption
  - Negative Adjustments
  - Reservations
```

A cached inventory-balance table may be maintained for fast queries, but the transaction ledger remains authoritative.

All stock-posting operations and cached-balance updates must execute in one database transaction.

## 12. Product Availability Service

Product availability should be calculated from component availability rather than stored as a permanent yes/no value.

### Input

```json
{
  "productVariantId": "product-id",
  "productionQuantity": 100
}
```

### Processing

1. Load the active BOM version.
2. Multiply each BOM-line quantity by the production quantity.
3. Convert quantities into the component's stock unit where necessary.
4. Retrieve free stock for every component.
5. Compare required stock with free stock.
6. Calculate shortages.
7. Calculate the maximum producible quantity.

### Example Response

```json
{
  "requestedQuantity": 100,
  "canProduce": false,
  "maximumProducibleQuantity": 75,
  "components": [
    {
      "itemCode": "MWH",
      "required": 200,
      "available": 150,
      "shortage": 50,
      "status": "SHORT"
    }
  ]
}
```

Maximum producible quantity should be based on the limiting component:

```text
Maximum Producible Quantity =
minimum of floor(component free stock / component quantity per product)
```

## 13. Database

Use PostgreSQL as the transactional relational database.

Indicative tables:

```text
users
roles
user_roles

items
item_categories
units
suppliers
item_suppliers

products
product_types
product_variants
characteristic_types
characteristic_values
product_variant_characteristics

code_masters
code_generation_rules

bom_headers
bom_versions
bom_lines

inventory_transactions
inventory_balances
stock_reservations

reorder_policies
audit_events
```

Use database controls including:

- Primary and foreign keys
- Unique constraints
- Check constraints
- Database transactions
- Appropriate indexes
- Optimistic concurrency where records may be edited simultaneously
- Schema migrations stored in source control

## 14. Security

Implement role-based access control.

Suggested roles:

- Administrator
- Inventory User
- Production User
- Management User

Technical security controls:

- HTTPS
- Strong user authentication
- Server-side authorisation checks
- Password hashing using an approved adaptive algorithm
- Session expiry
- Protection against cross-site request forgery where applicable
- Input validation and output encoding
- Secrets stored outside source code
- Restricted database credentials
- Encrypted backups
- Local firewall restrictions
- No shared user accounts

## 15. Audit and Accountability

Maintain append-only audit events for important operations.

Suggested audit fields:

```text
AuditEvent
- Event ID
- User ID
- Action
- Entity Type
- Entity ID
- Before Value
- After Value
- Reason
- Timestamp
- Client Address
```

Stock adjustments should require a reason and may optionally require approval based on role or quantity threshold.

## 16. Reporting

For the initial system, implement reports using PostgreSQL views or dedicated read queries.

Suggested views:

```text
current_inventory_view
low_stock_view
item_movement_view
product_requirement_view
material_requirement_view
item_usage_view
```

Large report generation should run through a background worker. Add a separate analytics database only if reporting later affects transactional performance.

## 17. Backups and Recovery

Minimum backup design:

```text
Primary Database  -> Host PC SSD
Daily Backup      -> External Drive or Separate Network Device
Additional Copy   -> Encrypted Off-Site Storage, if permitted
```

Operational requirements:

- Automated daily database backups
- Backup retention policy
- Backup success and failure logs
- Periodic restore tests
- Documented recovery procedure
- Database migration backup before application upgrades

A backup stored only on the host PC is not sufficient.

## 18. Monitoring and Operations

Monitor:

- Application availability
- API errors
- Database health
- Database connection usage
- Disk space
- Backup completion
- Background-job failures
- Failed login attempts
- Container health

Maintain separate development, test and production configurations. Application and database schema changes should be deployed using version-controlled migrations.

## 19. Single-PC Limitations

A single-PC deployment has the following technical constraints:

- The PC is a single point of failure.
- Application access stops when the PC is shut down or restarted.
- Hardware failure can interrupt operations.
- Windows updates may cause downtime.
- Local network failure prevents access from other devices.
- Resource-intensive use of the same PC may reduce application performance.

The host should therefore be dedicated, protected by a UPS and backed up to another physical device or location.

## 20. Evolution Path

### Initial Release

```text
Responsive Web App
        |
Modular Backend API
        |
PostgreSQL Database
```

### Future Expansion

```text
Web / Mobile / Barcode Scanner
              |
          API Gateway
              |
    Core Inventory Application
       |          |          |
  Purchasing  Production  Dispatch
              |
       Message/Event Broker
              |
     Reporting and Integrations
```

Future modules can include:

- Purchase Orders
- Production Orders
- Finished Goods
- Work in Progress
- Barcode and QR Operations
- Multiple Warehouses
- Costing
- Sales and Dispatch Integration

## 21. Recommended Initial Technology Stack

```text
Frontend:          Responsive PWA
Backend:           Modular REST API
Database:          PostgreSQL
Deployment:        Docker Compose
Reverse Proxy:     HTTPS-capable reverse proxy
Background Work:   Worker process with persistent job tracking
Authentication:    Application identity with role-based access
Backups:           Scheduled PostgreSQL backups to external storage
Monitoring:        Structured logs and health checks
```

The implementation should prioritise the product and BOM model, item-code controls, immutable inventory ledger, transaction integrity, availability calculation and backup recovery process.
