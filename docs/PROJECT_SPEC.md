# Franchise-Based Medicine, Clinic & Lab Management Platform

Full project specification: architecture, roles, tech stack, feature modules, and
system-wide business rules. This is the source-of-truth requirements document for
the MedTech platform. Also targets a Flutter mobile app alongside the web frontend
and this Spring Boot backend.

---

## 1. Project Overview

**Purpose:** a centralized healthcare platform enabling medicine sales, doctor
consultation bookings, lab test bookings, and billing/invoice generation across
multiple franchise locations, managed by a single admin system.

**Architecture decision:**
- Monolithic backend
- Modular package structure
- Scalable for a future microservices split

---

## 2. User Roles & Permissions

**Roles:** Admin (Super Admin), Customer Support, Franchise Owner, Patient,
Doctor, Lab Technician, Delivery Partner.

**Access control:**
- Role-Based Access Control (RBAC)
- JWT-based authentication
- Backend-enforced permissions (frontend is never trusted)

**Login method by role (enforced backend-side, not just on the client):**

Mobile OTP is removed for now — **Google OAuth is the only login method for
every role**, until OTP/WhatsApp delivery is built out.

| Role group | Login method | Notes |
|---|---|---|
| Patient, Franchise Owner | Google OAuth | No franchise scoping. First-ever sign-in with an unknown email auto-provisions a Patient. |
| Doctor, Lab Technician, Delivery Partner | Google OAuth **+** franchise/clinic ID | Account must be pre-provisioned (by an admin/franchise owner — that provisioning UI doesn't exist yet) with a `franchiseId`; login fails unless the submitted franchise ID matches the one their account is assigned to. |
| Admin, Customer Support | Google OAuth | Platform-wide, not franchise-scoped. Account must be pre-provisioned; there is no self-registration path for these roles. |

`email` is now the account's primary identity (unique, always set — Google
always supplies it). `mobile` is optional and not collected at signup; it's
meant to be filled in later via a profile step once WhatsApp notifications
are built, and is not currently used for login.

---

## 3. Tech Stack (Finalized)

- **Backend:** Spring Boot, Spring Security (JWT), Spring Data JPA, Spring
  WebSocket (STOMP), Spring Scheduler, Spring Async Events
- **Database:** PostgreSQL (primary transactional DB) via JPA/Hibernate,
  schema managed with Flyway migrations. **Supersedes this document's
  original MongoDB choice** — nothing in this domain (users, franchises,
  products, bills with line items) needed document flexibility over
  relational structure, and Postgres transactions replaced a manual
  rollback workaround the Mongo version needed for stock deduction. Every
  "Tech:" line below that still says MongoDB reflects the original
  spec and is stale; the rule going forward is Postgres by default,
  MongoDB only if a specific future feature genuinely needs it.
- **Notifications:** WhatsApp API for OTP, appointment confirmation, payment &
  invoice notifications
- **Payments:** Razorpay — Orders API, webhooks for payment validation, refund
  handling
- **PDF & Billing:** HTML + Thymeleaf templates, HTML → PDF (OpenHTMLtoPDF /
  Flying Saucer), franchise-wise custom templates
- **Infrastructure:** AWS EC2, AWS RDS (PostgreSQL), AWS S3 (reports &
  invoices), Nginx, HTTPS (Let's Encrypt)
- **Clients:** Web app + Flutter mobile app, both consuming the same backend API

---

## 4. Core Feature Modules

### 4.1 Authentication & OTP
- Phone-based login, WhatsApp OTP, JWT token issuance, role assignment
- Tech: MongoDB (OTP storage) with TTL index for auto-expiry, WhatsApp API,
  Spring Security
- Checklist: OTP TTL index configured; max OTP attempts enforced; OTP resend
  cooldown; JWT refresh token support

### 4.2 Patient Management
- Profile management, family member profiles, optional medical history
- Checklist: patient–franchise relationship validated; family member linking;
  data privacy enforced

### 4.3 Doctor Consultation Booking
- Doctor listing by specialization, slot-based booking, mandatory online
  payment for patient bookings, reschedule/cancel, appointment history
- **Mandatory business rule:** patient must pay the consultation fee online
  while booking; unpaid online booking from the patient side is not allowed
- **Franchise counter booking (special case):** franchise owner can add a
  patient manually; payment mode CASH or OFFLINE, marked "PAID (CASH)" —
  supports walk-in patients
- Tech: MongoDB (appointments) with a unique index for slot locking, Razorpay
  for online payments, Spring WebSocket for real-time updates
- Checklist: slot uniqueness enforced; online payment mandatory for patient
  booking; cash payment allowed only for franchise role; appointment status
  lifecycle defined

### 4.4 Lab Test Booking
- Test & package browsing, prescription upload, home collection or lab visit,
  report upload & download
- Tech: MongoDB, S3 for reports, WhatsApp notifications
- Checklist: report access secured; status flow enforced; home collection
  slots validated

### 4.5 Medicine Ordering & Inventory
- Medicine catalog, stock & batch management, expiry tracking, order
  placement, franchise-wise availability
- Tech: MongoDB, scheduled jobs for expiry alerts
- Checklist: stock deduction atomic; expiry alerts enabled; franchise
  isolation enforced

### 4.6 Coupon & Offer Management
- Flat/percentage coupon creation, usage limits, franchise-specific offers,
  auto-apply offers, abuse prevention
- Checklist: coupon locked before payment; usage counted after payment
  success; franchise applicability checked

### 4.7 Payment Module
- Order creation, online payments, refunds, webhook-based payment validation
- Tech: Razorpay Orders API, Razorpay webhooks, signature verification
- Checklist: frontend payment never trusted; webhook signature verified;
  amount & order ID validated; idempotency handled

**Per-franchise gateway credentials (mandatory rule):** there is no
platform-wide payment gateway. Each franchise owner must configure their own
Razorpay or PhonePe API key + secret when setting up their store. A
franchise with no gateway configured (or one later disabled) **cannot
accept online payment at all** — every sale for that franchise falls back
to cash. Secrets are encrypted at rest (AES-256-GCM) and never returned by
any API response, only a masked key.

### 4.8 Billing & Invoice Generation
- Automatic invoice generation, GST support, franchise-wise invoice
  numbering, custom PDF templates per franchise, download & WhatsApp delivery
- Tech: Thymeleaf, HTML → PDF engine, MongoDB invoice storage, S3 storage
- Checklist: invoice generated only after payment; franchise template
  fallback supported; invoice immutable after generation; GST fields included

### 4.9 Notification Module
- OTP messages, appointment confirmation, payment & invoice notification,
  status updates
- Tech: WhatsApp API, Spring Async, retry logic
- Checklist: async execution; failure retry; delivery logs stored

### 4.10 Franchise Owner Module
- Dashboard, doctor & staff management, manual appointment entry, cash
  payment handling, inventory & finance reports
- Checklist: cash payments restricted to franchise role; franchise data
  isolation; revenue reports accurate

### 4.11 Admin Module
- Franchise onboarding, pricing & commission control, coupon & offer
  management, global analytics, audit logs
- Checklist: role permissions locked; audit logs enabled; franchise
  suspension supported

**Subscription plans:** admin defines the plan catalog — a name, a flat
price, and which optional service modules it includes (Online Doctor
Appointment, Lab Services, Delivery). This is catalog management only:
assigning a plan to a specific franchise, billing/collecting for it, and
actually gating those modules by plan are separate, not-yet-built steps.

---

## 5. Non-Functional Requirements

- **Security:** JWT + role-based APIs, encrypted sensitive data, webhook
  signature verification
- **Performance:** slot locking, pagination everywhere, aggregation-based
  reports
- **Reliability:** idempotent webhooks, retryable notifications, backup
  strategy

---

## 6. Pre-Build Final Checklist

- **Architecture:** monolith confirmed; package structure finalized; no
  Kafka/Redis for MVP *(now actually true — Redis was removed entirely
  during the PostgreSQL migration; nothing in the codebase used it)*
- **Business rules:** patient consultation = online payment mandatory;
  franchise can accept cash payments; invoice only after payment success
- **Compliance:** GST fields validated; invoice numbering defined; audit logs
  enabled
- **Deployment:** AWS budget alert set; HTTPS enabled; backup strategy
  defined

---

## 7. System-Wide Micro Functionalities & Business Rules

### 7.1 Location & Nearest Franchise Logic
- Patient address resolves to pincode/geo-coordinates
- System finds active franchises serviceable in that pincode
- Priority order: (1) same pincode, (2) nearest distance, (3) franchise
  availability (stock/lab/doctor)
- Fallback required if the nearest franchise is unavailable

### 7.2 Medicine Delivery Charges
- Set by franchise owner, stored franchise-wise
- Can be flat (e.g. ₹30), distance-based (future), or free above an order
  value (e.g. ₹499+)
- Applied only for home delivery, never for store pickup
- Visible before checkout, included in invoice
- Backend calculates the charge; frontend cannot modify it
- Franchise owner can update delivery charges anytime; patient cannot bypass
  them

### 7.3 Lab Sample Collection Charges
- Set by franchise owner, separate from lab test price
- Can be free, flat, or conditional (e.g. free above ₹999)
- Applied only when collection type = HOME, not for lab visit
- Included in invoice as a separate line item
- Edge case: multiple tests in one order → a single collection fee

### 7.4 Doctor Consultation Payment Rules
- **Online booking (patient):** payment mandatory; consultation fee defined
  by franchise/doctor; slot is blocked only after payment success
- **Walk-in booking (franchise):** franchise owner can add patient manually
  and mark payment as CASH; cash amount recorded for settlement
- Patient cannot book an unpaid appointment online

### 7.5 Payment Edge Cases
- Partial payments not allowed for consultation or lab tests; optional for
  medicine orders in the future
- Payment failure: slot released after timeout, coupon usage unlocked, order
  marked FAILED
- Refunds: allowed if cancellation happens before the cutoff time; refund
  goes to the original payment mode

### 7.6 Coupon & Offer Edge Rules
- Coupon applicability to delivery charges / sample collection charges must
  be defined per coupon
- Franchise-specific coupons apply only if the order is fulfilled by that
  franchise
- Auto-apply offers: best applicable offer is auto-selected; offers cannot
  stack unless explicitly allowed

### 7.7 Billing & Invoice Details
- Invoice line items: medicine items, delivery charge (separate line),
  sample collection charge, discount, GST
- Franchise customization: invoice template per franchise, franchise GSTIN
  shown, franchise contact details
- Immutability rule: once generated, an invoice cannot be edited

### 7.8 Inventory Edge Cases
- Stock locked when an order is placed, deducted only after payment success
- Out-of-stock handling: suggest a substitute; partial orders not allowed by
  default
- Expiry handling: cannot sell expired medicines; near-expiry alert sent to
  the franchise owner

### 7.9 Notification Micro Rules
- WhatsApp notifications: OTP (mandatory), payment success (mandatory),
  invoice (mandatory), promotional (optional)
- Retry logic: retry failed messages up to N times; log delivery status

### 7.10 Franchise Owner Controls
- Editable: delivery charge, sample collection charge, doctor consultation
  fees, working hours, service pincodes
- Restricted (cannot change): platform commission, global coupon rules,
  invoice numbering logic

### 7.11 Admin-Level Rules
- Global overrides: enable/disable delivery charges platform-wide, cap
  maximum delivery charge, emergency franchise suspension
- Monitoring: high cancellation detection, coupon abuse detection, payment
  mismatch alerts

### 7.12 System Safety Rules (very important)
- All prices calculated on the backend; frontend is never trusted for money
- All status transitions validated
- Idempotent payment webhooks
- Role-based restrictions enforced server-side

---

## 8. Final Pre-Build Checklist (small but critical)

- **Pricing & charges:** franchise delivery charge configured; sample
  collection charge logic finalized; free delivery conditions defined
- **Payments:** online vs. cash rules frozen; refund conditions defined
- **Coupons:** coupon applicability to charges defined; franchise scope
  validated
- **Billing:** line-item structure finalized; franchise invoice templates
  ready
- **Notifications:** mandatory vs. optional notifications listed
