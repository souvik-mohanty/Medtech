# MedTech Platform

Franchise-based medicine, clinic & lab management platform. Purely
web-based: a single React client (`web/`) on a shared Spring Boot backend —
no mobile apps.

Two user roles: **Franchise** (shop owner) and **Patient**. There is no
Admin/Super Admin, Customer Support, Doctor, Lab Technician, or Delivery
Partner account — the shop owner handles doctor appointments, delivery, and
lab reports herself rather than those being separate logged-in roles. See
the User Roles section of `docs/PROJECT_SPEC.md` for the full rationale.

Full requirements, business rules, and module checklists:
[docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md). Read it before implementing any
feature module — several rules are easy to get wrong if skipped (e.g. patient
online consultation payment is mandatory but franchise counter bookings allow
cash; invoices are immutable once generated; frontend never computes money).

## Backend

- Location: `medtech/` (Maven project — note `mvnw`/`mvnw.cmd` at the repo
  root are misplaced, `pom.xml` and `.mvn/wrapper/` live in `medtech/`, so
  use system `mvn` instead, or fix the wrapper placement)
- Spring Boot 3.2.5, Java 21
- **PostgreSQL via Spring Data JPA/Hibernate, schema managed by Flyway**
  (`src/main/resources/db/migration/`) — migrated from MongoDB; see the
  Database bullet in `docs/PROJECT_SPEC.md` §3 for why. JWT auth (jjwt),
  Spring Security, Spring WebSocket (STOMP), Thymeleaf + OpenHTMLtoPDF for
  invoices, Spring Mail, Actuator + Micrometer/Prometheus
- Local Postgres: use the "PostgreSQL: Start (Docker)" VS Code task (also
  the first step of "Run All Services" / `Ctrl+Shift+B`) — it's idempotent:
  reuses the existing `medtech-postgres` container if there is one (running
  or stopped), only creates it fresh the first time. No `--rm`, so the
  container and its data survive stop/start (a "PostgreSQL: Remove
  (Docker)" task exists separately for when you actually want to wipe it
  and start clean). Manual equivalent: `docker run --name medtech-postgres
  -e POSTGRES_DB=medtech -e POSTGRES_USER=medtech -e
  POSTGRES_PASSWORD=medtech -p 5434:5432 -d postgres:16` (matches
  `application.yml`'s datasource defaults — port **5434**, not the default
  5432/5433, since other projects on this machine already have Postgres
  containers bound to those).
- `application.yml`'s datasource block reads `DB_URL`/`DB_USERNAME`/
  `DB_PASSWORD` env vars, falling back to the local Docker container above
  — never put real non-local credentials in this file, it's committed to
  git. To point at a hosted Postgres instead (e.g. Neon, when Docker isn't
  available), use the gitignored `application-local.yml` (profile `local`:
  `mvn spring-boot:run -Dspring-boot.run.profiles=local`, or
  `SPRING_PROFILES_ACTIVE=local`) — see the template/comment in that file's
  location, `medtech/src/main/resources/application-local.yml`. **If the
  hosted database is shared with another project**, don't assume the
  default `public` schema is empty — check first (this repo's own Neon
  instance turned out to already hold an unrelated project's tables).
  MedTech gets its own dedicated Postgres **schema** in that case
  (`spring.flyway.schemas` + `spring.jpa.properties.hibernate.default_schema`
  + `?currentSchema=...` on the JDBC URL, all set together), never the
  shared `public` one — verified working end-to-end against Neon: Flyway
  created the `medtech` schema and applied both migrations there without
  touching the other project's tables in `public`.
- Tests don't need real Postgres: `@ActiveProfiles("test")` (see
  `MedtechApplicationTests`, `BillingServiceTest`) swaps in H2 +
  Hibernate auto-DDL via `src/test/resources/application-test.yml` —
  production still uses Flyway-managed real Postgres
- Package root: `com.company.medtech`
  - `auth/` — Google OAuth login only for now (mobile OTP was removed; see
    the login-method table in
    [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md#2-user-roles--permissions)),
    JWT issuance. A first sign-in with an unknown email auto-provisions a
    Patient; Franchise (shop owner) has no self-service or admin path —
    provisioned directly in Postgres (`user_auth`/`franchise` rows,
    `role = 'FRANCHISE'`), by design
  - `common/` — shared constants (`AppConstants.ROLE_FRANCHISE`/
    `ROLE_PATIENT`), enums (`AppointmentStatus`, `OrderStatus`,
    `PaymentStatus`), exceptions, API response wrapper
  - `config/` — Security (JWT filter wired in, stateless sessions, CORS for
    the local dev origins in `cors.allowed-origins`) and JWT config are
    implemented; WebSocket/Payment config classes are still empty stubs,
    pending those modules
  - `franchise/` — no onboarding endpoint of any kind (deliberate — see
    `auth/` above); this module only manages a franchise that already
    exists. Owns the franchise's own profile + invoice branding (logo,
    accent color, one of a closed set of fonts, footer note, GSTIN/contact)
    via `GET/PUT /api/franchise/profile` — deliberately structured
    settings, not a free-form HTML/CSS template editor, see `InvoiceFont`
    — and payment gateway config
    (`GET/PUT/DELETE /api/franchise/payment-gateway`) — each franchise
    brings its own Razorpay/PhonePe API key + secret; the secret is
    AES-256-GCM encrypted at rest via `CredentialEncryptionService` (key:
    `security.credential-encryption-key`) and never returned by any API
    response, only a masked key. `Franchise#hasActivePaymentGateway()`
    gates online ordering — see `billing/` below. Also exposes
    `GET /api/patient/franchises` (all active franchises, public fields
    only) so the patient client never needs a franchise ID handed to it out
    of band — only one franchise exists today, so it just uses the first
    result, but the endpoint stays a list for when a second one exists.
  - `inventory/` — per-franchise product catalog (`Product`: name, unit,
    sellingPrice, purchasePrice, stock, GST %, mfgDate/purchaseDate/
    expiryDate — all three dates optional). Franchise owner manages it
    (`/api/franchise/inventory/products`) and gets dashboard insights
    (`GET /api/franchise/inventory/insights`: total products/stock
    units/inventory value, plus expiring-soon (30-day window) and
    already-expired product lists); patients browse a specific franchise's
    catalog read-only (`/api/patient/franchises/{franchiseId}/products`).
  - `billing/` — `Bill`/`BillItem` (real `@OneToMany` relationship now, not
    an embedded Mongo array; immutable once created — no update endpoint;
    optional per-bill `discountAmount` — flat or % input resolved to a
    fixed amount at creation, see `BillingService#applyDiscount` — and
    free-text `note`, both counter-sale only) with two creation paths:
    `FranchiseBillingController` (counter/walk-in sale, staff pick
    products, paid cash, invoice generated immediately, rejects an
    already-expired product) and
    `PatientOrderController` (online order — rejected outright unless the
    franchise has an active payment gateway configured, per
    `Franchise#hasActivePaymentGateway()`; otherwise `PAYMENT_PENDING`,
    stock not yet deducted, no invoice number —
    `BillingService#markPaidAndGenerateInvoice` is written for the future
    Payment Module's Razorpay webhook to call, but nothing calls it yet, so
    even a franchise with a gateway configured doesn't get a fully
    completed online order from this endpoint alone). Stock deduction and
    invoice numbering are real `@Transactional` DB transactions now
    (`ProductRepository#decrementStock` is a guarded bulk `UPDATE`,
    `FranchiseRepository#findByIdForUpdate` row-locks for the sequence
    increment) — the old MongoDB version needed a manual
    compensating-rollback workaround for this since single-node Mongo can't
    do multi-document transactions; that's gone, Postgres just rolls back
    the whole transaction on any failure. Verified with real rollback
    assertions in `billing/service/BillingServiceTest` (H2, no real Postgres
    needed for that test).
    `InvoicePdfService` renders the franchise-branded PDF via Thymeleaf
    (`resources/templates/invoices/medicine/default.html`) +
    OpenHTMLtoPDF — note that engine is CSS 2.1-era and has **no Flexbox
    support** (`display:flex` is silently dropped), so that template uses
    table-based layout only. Verified end-to-end with a real generated PDF
    in `billing/service/InvoicePdfServiceTest` (no Spring context needed
    for that test).
  - `lab/` — franchise owner's lab test catalog: individual tests
    (`LabTest`: name + price) and combo packages (`LabTestCombo`: name +
    combo price + a `@ManyToMany` bundle of the franchise's own tests) via
    `/api/franchise/labtests`(`/combos`), plus a patient browse-only mirror
    at `/api/patient/franchises/{id}/labtests`(`/combos`). Booking:
    `LabTestBooking` snapshots the item name/price at booking time
    (mandatory `address` + `mobileNumber`), `PaymentMode` CASH/ONLINE +
    `OrderStatus` PAYMENT_PENDING/PAID — ONLINE requires
    `Franchise#hasActivePaymentGateway()`, CASH is confirmed paid by the
    owner afterward via `PATCH .../bookings/{id}/mark-paid`. No real
    payment gateway is wired up yet, so both payment modes land in
    PAYMENT_PENDING for now (same caveat as `billing/`'s online orders).
  - `consultation/` — franchise owner's doctor visiting-window schedules
    (`DoctorSchedule`: doctor name/specialization entered directly, no
    login account; date + start/end time; fee; `SlotType` LIMITED, capped
    at `maxPatients` with each booking getting the next serial number
    under a row lock — `DoctorScheduleRepository#findByIdForUpdate`, same
    pattern as invoice numbering — or REQUEST, an uncapped "call me back"
    queue) via `/api/franchise/doctors/schedules`, appointments listing +
    mark-paid via `/api/franchise/doctors/appointments`, patient browse at
    `/api/patient/franchises/{id}/doctors/schedules` and booking at
    `/api/patient/doctors/appointments` — same CASH/ONLINE +
    PAYMENT_PENDING/PAID pattern as `lab/`.

No other feature modules (patient management beyond ordering, coupons,
payments) are implemented yet — only the package scaffold and shared
config exist for those areas.

## Frontend client

- `web/` — the platform's only client. React + TypeScript + Vite, Google
  OAuth login. One app, two role-gated sections after login: Patient (home
  page auto-detects the one active franchise via `GET /api/patient/franchises`
  — no franchise ID ever entered by hand — then order medicine, book a lab
  test/combo, book a doctor appointment) and Franchise/shop owner (billing
  incl. print + per-bill discount/note, inventory incl. dashboard insights,
  lab test catalog + bookings, doctor schedules + appointments, invoice
  branding, payment gateway config). There is no "become a shop owner" flow
  anywhere in the client — Franchise accounts don't self-serve, see `auth/`
  above. Client-side routing gates by role (`src/auth/RoleRoute.tsx`); the
  backend's own `/api/franchise/**` / `/api/patient/**` RBAC
  (`SecurityConfig`) is the real security boundary. See `web/README.md`.

`web/` needs `google.oauth.client-id` (backend) and its own Google client ID
config to match, or OAuth login will fail verification — see the Google
OAuth section of `docs/PROJECT_SPEC.md`. The real client ID
(`688656564041-...apps.googleusercontent.com`, a dedicated "MedTech
Platform" Web application client in project `vertexcodelabs` — not the
original shared client, which had a different app's redirect URIs) is
already set in the backend and `web/.env.local` (gitignored). The matching
client **secret** is never stored anywhere in this repo — the ID-token
verification flow used here doesn't need it, only the client ID (which is
not secret; it's meant to be embedded in clients).

## Status

Git-initialized.
