# SweafEx Digital Operations Platform
### Segment 1: Foundation & Master Data CRM

> **Architecture & Implementation Baseline**  
> Aligned with `SweafEx_Software_Development_Technical_Specification_v1.docx` and `SweafEx_Pricing_Commercial_Proposal_Octagram.pdf`.

---

## 🚀 Overview

The **SweafEx Operations & Logistics Management Platform** centralizes day-to-day freight brokerage operations into a unified source of operational truth. 

**Segment 1** establishes the foundation:
- **TypeScript Monorepo Architecture**: Clean separation between `@sweafex/shared`, `@sweafex/backend`, and `@sweafex/frontend`.
- **RBAC Security Layer**: Role-based access control protecting all API routes across 5 internal roles (`ADMIN`, `MANAGEMENT`, `SALES`, `TRAFFIC_OPS`, `ACCOUNTS`).
- **Customer Master & CRM**: GSTIN/PAN validation, multi-corridor freight rate contracts, primary operational contacts, and 1-click CSV exports.
- **Transporter & Vendor Master**: Logistics partner profiles with verified payout bank details (IFSC, Account Number, Bank Name) and ratings.
- **Fleet & Driver Directory**: Vehicle inventory (Containers MXL/SXL, Taurus trucks, capacities) and driver records with license tracking.
- **30-Day Compliance & Expiry Engine**: Automated real-time tracking of RC, vehicle insurance, fitness certificates, permits, and DLs with color-coded alerts (`Valid`, `<30 Days Expiring Soon`, `Expired`).
- **Append-Only Audit Trail**: Tamper-evident logging of every master data change with actor identity, role, timestamp, and IP address.
- **Production Clean Command**: One command to purge all dummy fixtures and prepare the database for production onboarding.

---

## 📂 Project Structure

```text
sweafex/
├── docker-compose.yml              # Local PostgreSQL container service
├── package.json                    # Monorepo workspaces & dev scripts
├── shared/                         # Shared TypeScript domain contracts
│   ├── src/index.ts                # Enums, interfaces (UserRole, Customer, Transporter, Compliance)
│   └── tsconfig.json
├── backend/                        # Node.js + Express + Prisma ORM REST API
│   ├── prisma/
│   │   └── schema.prisma           # Relational schema (PostgreSQL)
│   ├── src/
│   │   ├── config/                 # Environment & JWT configuration
│   │   ├── controllers/            # Auth, Customer, Transporter, Compliance, Documents, Audit
│   │   ├── middleware/             # authenticateJwt, requireRole (RBAC), logAuditEvent
│   │   ├── routes/                 # Express API routes
│   │   ├── services/               # ComplianceService (30-day alerts), StorageService (pluggable uploads)
│   │   ├── seeds/
│   │   │   ├── seed.ts             # Realistic Indian logistics master data fixture
│   │   │   └── clean.ts            # Production wipe script
│   │   └── index.ts                # Server entry point
│   └── .env
└── frontend/                       # React 18 + Vite + Tailwind CSS Operations Portal
    ├── src/
    │   ├── api/client.ts           # Fetch client with auto-token injection & refresh
    │   ├── context/AuthContext.tsx # Authentication & RBAC role permission state
    │   ├── components/             # Sidebar, Header (with quick role test switcher)
    │   └── pages/
    │       ├── Login.tsx           # Sign-in page with 1-click test role logins
    │       ├── Dashboard.tsx       # Executive KPI cards & urgent compliance alerts
    │       ├── Customers.tsx       # Customer Master CRM & corridor rate management
    │       ├── Transporters.tsx    # Transporter Master & payout bank accounts
    │       ├── Fleet.tsx           # Fleet trucks and drivers with compliance badges
    │       ├── Compliance.tsx      # Comprehensive 30-day early warning center
    │       └── AuditLogs.tsx       # Tamper-evident audit trail viewer
    └── vite.config.ts
```

---

## 🛠️ Quick Start

### 1. Start Database
If using Docker:
```bash
docker compose up -d
```
*(Or use an existing PostgreSQL instance on `localhost:5432` with credentials in `backend/.env`)*

### 2. Push Schema & Seed
```bash
# Push Prisma schema to PostgreSQL
npm --workspace=backend run db:push

# Populate realistic demo seed data
npm run db:seed
```

### 3. Launch the Platform
Run both the Backend API (`http://localhost:5001`) and Frontend Web App (`http://localhost:5173`) in one command:
```bash
npm run dev
```

---

## 👥 Demo Logins (Password: `Sweafex@2026`)

The platform includes pre-configured test accounts across all 5 operational roles:

| Role | Email | Permissions / Primary Workspace |
|---|---|---|
| **Super Admin** | `admin@sweafex.com` | Full administrative bypass, audit logs, system configuration |
| **Management** | `management@sweafex.com` | Commercial overview, rate ceiling approvals, audit inspection |
| **Sales** | `sales@sweafex.com` | Customer Master, client rate agreements, corridor negotiation |
| **Traffic Ops** | `ops@sweafex.com` | Transporter onboarding, fleet assignment, driver licenses |
| **Accounts** | `accounts@sweafex.com` | View-only customer/vendor masters, bank detail verification |

> *Tip: On the top navigation bar, click the **"Test as: Admin / Sales / Traffic Ops / Accounts"** buttons to switch roles with a single click and test RBAC permissions instantly!*

---

## 🧹 Transition to Production

When moving from development/staging to production, wipe all sample customers, demo transporters, and test fleet records with:

```bash
npm run db:clean-prod
```

This cleans all operational tables and ensures a single pristine Super Admin (`admin@sweafex.com`) is ready for live operational onboarding.
