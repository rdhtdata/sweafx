# SweafEx Operations CRM: Solution Proposal
**A Centralized Platform for Managing the Complete Freight Lifecycle**

* **Prepared for:** Whooosh Networks Pvt Ltd (SweafEx) — Management & Operations Leadership
* **Prepared by:** Octgram
* **Date:** March 2026
* **Version:** 1.0 (Confidential — Client Presentation)

---

## 1. Executive Summary & Strategic Positioning

SweafEx is rapidly scaling its Full Truck Load (FTL) freight brokerage across South India. Today, managing high-velocity operations across 8+ WhatsApp groups, multiple Excel spreadsheets, and manual communication creates operational bottlenecks, transcription errors, and visibility gaps.

**Octgram proposes a centralized Operations CRM that unifies SweafEx's freight lifecycle into one connected workflow — while continuing to work directly with Zoho for accounting, billing, and financial reconciliation.**

```
+----------------------------------------------------------------------------------------------------+
|                                 SWEAFEX TARGET TECHNOLOGY ECOSYSTEM                                 |
+--------------------------------------------------+-------------------------------------------------+
|              OCTGRAM CRM                        |                 ZOHO SUITE                      |
|       (Operational CRM & Workflow)               |         (Financials & Accounting)               |
+--------------------------------------------------+-------------------------------------------------+
| • Customer & Vendor Profiles                     | • Purchase Orders & Bills (URPM Memos)          |
| • Omnichannel Enquiries (ENQ) & Lost Reasons     | • Section 194C TDS (2%) Deductions              |
| • Dynamic Rate Board & Margin Floor Controls     | • Official Customer GST Invoices                |
| • Order Management (ORD)                         | • Vendor Advance (90%) & Balance (10%) Bills    |
| • Single EXP Trip ID Generation & Locking        | • Customer Payment Receipts & Reconciliation    |
| • 13-Milestone Real-Time Tracking with Timestamps| • Bank Payout Approvals (NEFT/IMPS)             |
| • 5-Stage Physical & Digital POD Tracker         | • General Ledger & Statutory Tax Filings        |
| • Zero-Install Customer & Driver Mobile Links    | • Corporate P&L and Balance Sheets              |
+--------------------------------------------------+-------------------------------------------------+
                                                   |
                         +-------------------------+-------------------------+
                         |                                                   |
+------------------------v-------------------------+       +-----------------v-----------------------+
|              WHATSAPP BUSINESS API               |       |         EXTERNAL VERIFICATION APIS      |
| • Instant Customer Auto-Acknowledgment (<60s)    |       | • Vehicle RC Verification (Vahan)       |
| • Vehicle Placement Advisories                   |       | • Driver DL Verification (Sarathi)      |
| • Auto-Generated TCN Dispatch                    |       | • GSTIN Validation & E-Way Bill Lookup  |
| • Milestone Notifications & POD Receipts         |       |                                         |
| • Automated Day 7, 14 & 21+ Payment Reminders    |       |                                         |
+--------------------------------------------------+-------------------------------------------------+
```

---

## 2. The Current Challenge vs. The Future State

### Current State
* **Information Trapped in Chat Threads:** 8 WhatsApp groups hold critical trip updates, rates, and timestamps without a searchable audit trail.
* **Manual Transcription Errors:** Trip IDs and truck numbers are re-typed across WhatsApp messages and Excel files, causing data mismatches.
* **Delayed POD Lifecycle:** Vendor balances remain blocked and customer billing is delayed due to manual physical POD tracking.
* **Invisible Real-Time Margins:** Customer rates and vendor costs sit in separate spreadsheets, obscuring profitability until month-end.

### Future State with Octgram CRM
* **One Trip. One EXP. One Source of Truth:** A single immutable `EXP` Trip ID permanently links customer enquiry, vendor quotes, RC/DL verification, signed TCN, POD photos, and Zoho billing records.
* **Dynamic Rate Board:** Real-time customer rate ranges ($Min - Max$) and instant gross margin calculations with automated floor alerts.
* **Zero-Friction Mobile Access:** Customers track shipments and download TCNs/invoices via WhatsApp magic links; drivers update milestones and upload POD photos without installing any app.
* **Automated Trust & Compliance:** Third-party RC and DL verification APIs validate vehicle fitness and driver licenses before vehicle placement.

---

## 3. End-to-End Operational Modules

1. **Customer & Sales Management:** Complete customer master profiles, GSTINs, payment terms, and omnichannel enquiry capture (`ENQ`).
2. **Vendor & Fleet Master:** Transporter repository, document vault (RC, DL, PAN, Passbook, Truck Photo), and automated 30-day expiry notifications.
3. **Quote & Rate Board:** Real-time vendor quote comparison (up to 4 quotes) with masked customer identity and management margin guards.
4. **Order & Trip Management (`EXP`):** 13 granular milestone checkpoints with timestamps from truck departure to final unloading.
5. **Trip Confirmation Note (TCN) Engine:** Pre-filled TCN PDF auto-generated upon `Loading Started` and shared with the customer in 1 click.
6. **5-Stage POD Lifecycle:** Seamless tracking across *Not Collected $\rightarrow$ Soft Copy Received $\rightarrow$ Hard Copy In Transit $\rightarrow$ Hard Copy at Office $\rightarrow$ Submitted to Customer*.
7. **Executive Dashboards & BI:** Real-time visibility into active trips, route margins, pending PODs ($>7\text{ days}$), and lead conversion rates.

---

## 4. Third-Party Services & Commercial Structure

### Included in Octgram Implementation
* Complete custom CRM platform development across all 13 operational modules.
* Dynamic Rate Board and Margin Guard configuration.
* Zero-install Customer and Driver mobile web workflows.
* Meta WhatsApp Business API integration and message template orchestration.
* External RC/DL verification API connectors.
* Zoho Books financial integration bridge.
* Historical Excel data migration, comprehensive team training, and 30 days post-launch hypercare.

### External Third-Party Services (Passthrough Costs)
| Service / Integration | Operational Purpose | Commercial Status |
| :--- | :--- | :--- |
| **WhatsApp Business API** | Automated customer alerts, TCN dispatch, reminders | `[TO BE CONFIRMED]` |
| **Vehicle RC Verification API** | Real-time vehicle fitness, insurance & owner validation | `[TO BE CONFIRMED]` |
| **Driver DL Verification API** | Real-time driver licence validity check | `[TO BE CONFIRMED]` |
| **GST / E-Way Bill API** | Single-click GSTIN check & E-Way Bill generation | `[TO BE CONFIRMED]` |
| **Cloud Hosting / Server Infrastructure** | High-availability cloud server & encrypted storage | `[TO BE CONFIRMED]` |
| **Zoho Subscriptions** | Accounting & billing suite | Existing / Client Account |

### Commercial Proposal Summary
* **Platform Development:** ₹ `[________]`
* **Implementation & Deployment:** ₹ `[________]`
* **Annual Maintenance & Support:** ₹ `[________]`
* **Third-Party Services (Est.):** ₹ `[________]`
* **Total Proposed Investment:** ₹ `[________]`

---

## 5. Next Steps to Kickoff

1. **Scope & Commercial Agreement:** Confirm scope and timeline requirements.
2. **Third-Party API Provider Selection:** Finalize vendor accounts for WhatsApp Business API and RC/DL verification.
3. **UI/UX & Workflow Walkthrough:** Conduct interactive screen reviews with SweafEx operations leadership.
4. **Sprint Kickoff:** Initiate Phase 1 development with weekly demonstration milestones.

---
**Octgram**  
*Building the digital backbone for high-growth enterprises.*  
* **Email:** [vishnu@octagramai.com](mailto:vishnu@octagramai.com)  
* **Phone:** +91 9482090023  
* **Website:** [www.octagramai.com](https://www.octagramai.com)
