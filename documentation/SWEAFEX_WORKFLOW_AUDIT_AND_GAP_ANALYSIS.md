# SweafEx Operations Platform — Comprehensive Workflow Audit, Business Analysis & Segment 1 Gap Analysis

**Author:** Octagram AI & Software Solutions (Senior Architecture & Business Process Analysis Team)  
**Date:** November 2026  
**Status:** Pre-Implementation Architectural Baseline  
**Primary Source Documents:**  
1. `documentation/existing_documents.txt` (Data Dictionary, Excel/CRM Formats & WhatsApp Message Documentation)  
2. `documentation/update_doc.txt` (Current-State Operations, Data & Communication Documentation)  
3. `documentation/doc.txt` (SweafEx Business Requirements Document — Live 15-Step SOP, March 2026)  
4. `documentation/process.txt` (Department Workflow Analysis)  
5. `SweafEx_Software_Development_Technical_Specification_v1.docx` (5-Segment Engineering Specification)  

---

## 1. Executive Summary & Business Understanding

SweafEx (Whooosh Networks Pvt Ltd) operates as a tech-enabled freight brokerage across South India, handling Full Truck Load (FTL) freight movements. SweafEx does not own physical trucks; it acts as the operational coordination and management layer between enterprise **shippers/clients** (e.g. Marico, Havells, Schneider Electric, Micron) and outsourced **transportation suppliers** (fleet companies, transport brokers, and independent truck owners).

The live operational flow moves through distinct stages:
```text
CUSTOMER ENQUIRY (WhatsApp/Call)
       ↓
ENQUIRY LOGGING (ENQ Number generated)
       ↓
RATE BOARD & VENDOR SOURCING (Up to 4 Vendor Quotes collected)
       ↓
REQUIREMENT ACTIVATION (Best Rate evaluated, Manual Selection, Target Margin protected)
       ↓
PLACEMENT HANDOFF (Vehicle & Driver verification, Document compliance check)
       ↓
[SEGMENT 2] ORDER & TRIP EXECUTION (EXP Trip ID, 13 Milestones, TCN, POD, Billing)
```

Historically, SweafEx operated this entire lifecycle across 8 unlinked WhatsApp groups and fragmented Excel spreadsheets (Enquiry Sheet, Requirement Sheet, Placement Sheet, Vendor CRM, Broker CRM, Supplier Details). This caused:
- Duplicate data re-entry (copying vehicle numbers and rates by hand into WhatsApp and multiple sheets).
- Manual Trip ID mismatch errors.
- Lack of audit trail for spec changes and rate negotiations.
- Unstructured quotation comparisons.

---

## 2. Decoded Ambiguous Terminology & Business Rules

Based on rigorous analysis of the source documentation, the ambiguous terms are clarified as follows:

| Term / Symbol | Document Location | Verified Operational Meaning | Technical Representation |
|---|---|---|---|
| **`Trans ID`** (`29AAECW3533B1ZI`) | Client WhatsApp Trip Confirmation | **Transporter ID / Transporter GSTIN**. In Indian statutory logistics (E-Way Bill), the Transporter ID is the 15-digit GSTIN used to assign cargo to the transporter in Part-B of the E-Way Bill. | Stored as `transporterGstin` / `transporterId` on the transporter and trip record. |
| **`Passing`** | Vehicle Management & CRM Sheets | **RTO Approved Carrying Capacity (Payload)**. The permitted gross tonnage passed and registered on the Vehicle RC (e.g. 7 Tonnes, 14 Tonnes, 21 Tonnes). | Stored as `passingCapacityTons` (`Decimal(5,2)`). |
| **`A/c`** | Supplier Financial Details | **Account Settlement / Verification Flag**. Indicates whether vendor payout is verified to go directly to a registered corporate bank account via NEFT (mandated by Section 194C TDS rules to eliminate personal UPI payments). | Stored as `bankAccountVerified` flag and payout method status. |
| **`Unload`** | Enquiry & Trip Sheets | Dual meaning: In intake, refers to the **Unloading Destination City & PIN code**; in trip execution, refers to the **Dock Unloading Milestone**. | Modeled as `unloadingCity` / `unloadingAreaPin` in Enquiry, and `UNLOADING_STARTED` / `UNLOADED` in trip milestones. |
| **The Cross Symbol (`❌`)** (`AP39UB 3717❌`, `AP00 220210030453❌`) | Client WhatsApp Match Message | **Compliance / Verification Failure/Pending Status**. Indicates that the vehicle or driver is newly assigned but their government RTO/Sarathi document check has NOT yet been completed. | Stored as `verificationStatus: UNVERIFIED` (`❌`) vs `VERIFIED` (`✅`). Prevents unverified vehicles from being presented as verified. |

---

## 3. Existing Software Architecture Summary

The existing repository was scaffolded with:
- **Monorepo**: `@sweafex/shared`, `@sweafex/backend` (Express, Prisma ORM, PostgreSQL), and `@sweafex/frontend` (React 18, Vite, Tailwind CSS).
- **Authentication**: JWT access/refresh token mechanism with 5 internal roles (`ADMIN`, `MANAGEMENT`, `SALES`, `TRAFFIC_OPS`, `ACCOUNTS`).
- **Implemented Masters**: Basic Customer Master, Transporter Master, Fleet Vehicles, and Drivers.
- **Compliance Engine**: 30-day early warning calculation for RC, Insurance, Fitness, and DL dates.
- **Audit Logging**: Basic audit trail logging actor, role, entity, and timestamp.

---

## 4. Workflow Gap Analysis

| Requirement | Existing Implementation | Gap Identified | Required Change | Segment |
|---|---|---|---|---|
| **Customer Enquiry Intake (ENQ-01 to ENQ-08)** | None | Missing entirely. No Enquiry database model, API, or frontend UI. | Implement `Enquiry` model with auto-generated immutable `ENQxxx` numbers, Loading/Unloading PINs, vehicle specs, material, target rate, and customer link. | **Segment 1** |
| **Requirement Management (M01/M04)** | None | Missing entirely. Enquiries cannot be converted into active operational Requirements without duplicating data. | Implement `Requirement` model linked 1-to-1 with Enquiry, holding trip rate, final status, and handoff state. | **Segment 1** |
| **Vendor Quotations & Comparison (QRB-01 to QRB-06)** | None | Missing entirely. Cannot log up to 4 vendor quotes against an enquiry. Best rate is not calculated. | Implement `VendorQuote` entity, rate comparison board, automatic lowest-rate indicator, manual selection override, and quote history. | **Segment 1** |
| **Vendor & Broker Differentiation** | Generic Transporter model | Transporter model treats all vendors identically. Lacks `partyType` (Broker vs Fleet Owner vs Truck Owner), broker contact, response time, reliability rating. | Enrich `Transporter` entity with `partyType`, `brokerName`, `truckOwnerName`, `brokerOwnerPhone`, `reliabilityRating`, `responseTimeMinutes`. | **Segment 1** |
| **Vehicle Verification Fields** | Basic Vehicle model (RC, Insurance, Fitness, Permit) | Missing `taxExpiryDate`, `puccExpiryDate`, `passingCapacityTons`, `isBlacklisted`, `verificationStatus` (`VERIFIED`/`UNVERIFIED`). | Add Tax, PUCC, Passing Capacity, Blacklist flag, and Verification status to `Vehicle`. | **Segment 1** |
| **Driver Verification Fields** | Basic Driver model (DL number, expiry) | Missing `dlCompatibility` (HTV/LMV), `isBlacklisted`, `verificationStatus` (`VERIFIED`/`UNVERIFIED`). | Add DL Compatibility, Blacklist flag, and Verification status to `Driver`. | **Segment 1** |
| **CRM Multi-Field Search (12 Filters)** | Simple text query on Customers/Transporters | Search cannot filter across vehicle type, vehicle size, loading city, unloading city, passing capacity, vendor, driver name. | Implement unified CRM Search API & UI supporting combined partial filters across Segment 1 master and enquiry data. | **Segment 1** |
| **WhatsApp Requirement Ingestion & Formatting** | None | System cannot parse incoming WhatsApp requirement text or preview outgoing vehicle-match confirmations. | Build structured WhatsApp Requirement Parser preview utility and Trip Confirmation Formatter for Segment 1 records. | **Segment 1** |
| **Initial Placement Handoff** | None | No structured state transition when a vendor quote is approved and requirement is ready for dispatch. | Add `READY_FOR_PLACEMENT` status transition linking selected vendor, vehicle, driver, and agreed rate for seamless Segment 2 intake. | **Segment 1** |
| **Full Placement Workspace & EXP Generation** | Out of scope | Belongs to Segment 2. | Deferred to Segment 2. | **Segment 2** |
| **13 Milestone Operational Tracking** | Out of scope | Belongs to Segment 2. | Deferred to Segment 2. | **Segment 2** |
| **WhatsApp Business API & Live RTO Integrations** | Out of scope | Belongs to Segment 3. | Deferred to Segment 3. | **Segment 3** |
| **Customer & Driver External Web Portals** | Out of scope | Belongs to Segment 4. | Deferred to Segment 4. | **Segment 4** |

---

## 5. Scope Assessment for Segment 1 Implementation

To satisfy the business requirements without violating the 5-segment boundaries, Segment 1 will implement:
1. **Enquiry Intake Module**:
   - Structured entry with auto-generated sequential `ENQ` identifiers (e.g. `ENQ001`).
   - Customer linking (reuse existing customer or inline selection).
   - Origin/destination: Loading City + Loading PIN, Unloading City + Unloading PIN.
   - Material specs: Weight, Type, Vehicle Length, Vehicle Type.
   - Target price, loading timing ("Immediate / Now" or scheduled date).
   - Enquiry status lifecycle (`NEW` → `SENT_TO_PURCHASE` → `QUOTES_RECEIVED` → `RATE_SET` → `CONFIRMED` → `CLOSED`).
   - Closure reason tracking for lost business analysis (`RATE_DIFFERENCE`, `VEHICLE_NOT_AVAILABLE`, `CUSTOMER_ARRANGED_OWN`, etc.).
2. **Vendor Quotations & Rate Board**:
   - Capture up to 4 vendor quotes per enquiry (or dynamic list).
   - Selection of existing vendors from Vendor Master.
   - Quoted rate, vendor availability (`AVAILABLE`, `UNAVAILABLE`, `TENTATIVE`), vehicle number, and notes.
   - Automatic identification of "Best Rate" (lowest comparable quote).
   - Manual selection by authorized Sales/Operations employee (human in the loop).
3. **Requirement Lifecycle & Handoff**:
   - Clean 1-to-1 link from Enquiry to Requirement.
   - Preserves historical enquiry specs and quote history without data duplication.
   - Status handoff (`READY_FOR_PLACEMENT`) preparing selected vendor, vehicle, and driver for Segment 2 EXP trip generation.
4. **Enhanced Vendor / Broker CRM**:
   - Classification: `BROKER`, `FLEET_OWNER`, `TRUCK_OWNER`, `TRANSPORTER`.
   - Contact Person, Phone, Broker/Owner details, PAN, GSTIN.
   - Performance indicators: Response time, Reliability rating, Total trips count.
5. **Vehicle & Driver Compliance Records**:
   - Vehicles: Size, Type, Passing/Capacity (Tons), Insurance, Tax, Fitness, PUCC validity, Blacklist flag, Verification status (`VERIFIED` vs `UNVERIFIED` with `❌` / `✅` display).
   - Drivers: Full Name, Phone, DL Number, DL Expiry, DL Compatibility (HTV/LMV), Blacklist flag, Verification status.
6. **Multi-Field CRM Search**:
   - Combined filters across Vehicle Number, Size, Type, Loading City, Unloading City, Passing Capacity, Vendor/Party, and Driver Name.
7. **WhatsApp Format Parser & Confirmation Generator**:
   - 1-click clipboard parser for incoming customer requirement messages.
   - Auto-formatter for outgoing vehicle-matched trip confirmation messages with exact company wording and verification status badges.

---

## 6. Business Questions Requiring SweafEx Clarification

The following questions are noted for ongoing alignment with SweafEx leadership:
1. **WhatsApp Immediate Requirements**: When a client requests `Loading: Now`, what is the maximum acceptable placement SLA (e.g., 60 minutes vs 2 hours)?
2. **Rate Board Approval Ceiling**: Above what margin difference or discount threshold is Operations Manager approval strictly required before Sales can confirm an order?
3. **Vendor Substitution Policy**: If a vendor substitutes a vehicle after placement, does it require customer re-confirmation in all cases or only if vehicle size/passing changes?
4. **Driver DL Compatibility Rules**: What specific vehicle classes (e.g., 32ft MXL vs 20ft Open) require commercial Heavy Transport Vehicle (HTV) endorsements versus Light Transport Vehicle (LTV)?
5. **Transporter A/c Field Confirmation**: Confirm whether `A/c` is exclusively a flag for verified NEFT bank transfer or also indicates TDS exemption certificate (under 194C(6) for small truck owners owning ≤10 trucks).

---

## 7. Proposed Implementation Plan

1. **Database Schema Migration**:
   - Add `Enquiry`, `Requirement`, and `VendorQuote` models.
   - Add new compliance and broker fields to `Transporter`, `Vehicle`, and `Driver`.
   - Ensure foreign keys and indices protect integrity.
2. **Backend API Services & Endpoints**:
   - `enquiry.controller.ts` & `enquiry.routes.ts`: CRUD, status pipeline, closure reasons, convert to requirement.
   - `quote.controller.ts`: Add/update quotes, calculate best rate, select winning quote.
   - `requirement.controller.ts`: List active requirements, update handoff status.
   - `search.controller.ts`: Multi-criteria CRM search endpoint.
   - RBAC guards applied to all endpoints (`SALES`, `TRAFFIC_OPS`, `MANAGEMENT`, `ADMIN`).
3. **Frontend Operational Workspaces**:
   - `Enquiries.tsx`: Enquiry Board, New Enquiry Modal (with WhatsApp text auto-parser), Quote collection modal with side-by-side comparison.
   - `Requirements.tsx`: Active requirements board, handoff to placement.
   - Enhanced `Transporters.tsx`, `Fleet.tsx`: Displaying party types, PUCC, Tax, Passing, DL compatibility, verification badges.
   - `CrmSearch.tsx`: 12-filter advanced operational lookup.
4. **Comprehensive Automated Verification & Testing**:
   - End-to-end integration test simulating live enquiry intake, vendor quoting, quote comparison, manual selection, and handoff.
