# MedTech Platform

Franchise-based medicine, clinic & lab management platform. Web + Flutter
mobile clients on a shared Spring Boot backend.

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
  `application.yml`'s datasource config — port **5434**, not the default
  5432/5433, since other projects on this machine already have Postgres
  containers bound to those).
- Tests don't need real Postgres: `@ActiveProfiles("test")` (see
  `MedtechApplicationTests`, `BillingServiceTest`) swaps in H2 +
  Hibernate auto-DDL via `src/test/resources/application-test.yml` —
  production still uses Flyway-managed real Postgres
- Package root: `com.company.medtech`
  - `auth/` — Google OAuth login only for now (mobile OTP was removed; see
    the login-method table in
    [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md#2-user-roles--permissions)),
    JWT issuance, role-aware login rules
  - `common/` — shared constants (roles, role groups), enums
    (`AppointmentStatus`, `OrderStatus`, `PaymentStatus`), exceptions, API
    response wrapper
  - `config/` — Security (JWT filter wired in, stateless sessions, CORS for
    the local dev origins in `cors.allowed-origins`) and JWT config are
    implemented; WebSocket/Payment config classes are still empty stubs,
    pending those modules
  - `franchise/` — a franchise's own profile + invoice branding (logo,
    accent color, one of a closed set of fonts, footer note, GSTIN/contact).
    `GET/PUT /api/franchise/profile`. Deliberately structured settings, not
    a free-form HTML/CSS template editor — see `InvoiceFont`. Also owns
    payment gateway config (`GET/PUT/DELETE /api/franchise/payment-gateway`)
    — each franchise brings its own Razorpay/PhonePe API key + secret; the
    secret is AES-256-GCM encrypted at rest via `CredentialEncryptionService`
    (key: `security.credential-encryption-key`) and never returned by any
    API response, only a masked key. `Franchise#hasActivePaymentGateway()`
    gates online ordering — see `billing/` below.
  - `inventory/` — per-franchise product catalog (`Product`: name, unit,
    price, stock, GST %). Franchise owner manages it
    (`/api/franchise/inventory/products`); patients browse a specific
    franchise's catalog read-only
    (`/api/patient/franchises/{franchiseId}/products`).
  - `billing/` — `Bill`/`BillItem` (real `@OneToMany` relationship now, not
    an embedded Mongo array; immutable once created — no update endpoint)
    with two creation paths: `FranchiseBillingController` (counter/walk-in
    sale, staff pick products, paid cash, invoice generated immediately) and
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
  - `subscription/` — admin-only (`/api/admin/subscription-plans`, reuses
    the existing `hasRole(ADMIN)` rule) CRUD for the subscription plan
    catalog: name, flat price, which of `PlanFeature`
    (`DOCTOR_APPOINTMENT`/`LAB_SERVICES`/`DELIVERY`) it includes. Catalog
    only — there is no link from `Franchise` to a chosen plan yet and
    `PlanFeature` isn't enforced anywhere (those modules don't exist yet
    either).
  - `resources/templates/invoices/` — Thymeleaf templates for
    appointment/medicine invoices
  - `resources/templates/notifications/` — email/WhatsApp templates

No other feature modules (patient management beyond ordering, doctor
booking, lab, coupons, payments) are implemented yet — only the package
scaffold and shared config exist for those areas. Notably: there is still no
admin API to provision Franchise Owner, Doctor, Lab Technician, Delivery
Partner, Admin, or Customer Support accounts, **or Franchise documents** —
those currently must be inserted into `user_auth` / `franchise` directly.

## Frontend clients

- `admin-web/` — Super Admin webpage. React + TypeScript + Vite, Google
  OAuth login (client-side gated to `ADMIN`/`CUSTOMER_SUPPORT`). Real
  feature: Subscription Plans page (create/list/deactivate plans against
  `/api/admin/subscription-plans`) — the rest of the dashboard is still a
  placeholder. See `admin-web/README.md`.
- `apps/` — six independent Flutter apps, one per non-admin role (Patient,
  Franchise Owner, Doctor, Lab Technician, Delivery Partner, Customer
  Support). Google OAuth login wired to the backend, JWT attached to every
  request via a Dio interceptor; Doctor/Lab Technician/Delivery Partner also
  require a franchise ID. `patient_app` (browse + order) and `franchise_app`
  (billing incl. print, inventory, branding, payment gateway config) call
  real backend endpoints; the other four have no backend module to call yet,
  so their dashboards show clearly-commented static mock data instead — see
  `apps/README.md`'s table. **Flutter SDK was not available when these were
  created**, so only `pubspec.yaml`/`lib/` exist and none of this has been
  run; see `apps/README.md` for the `flutter create .` step needed to add
  platform folders. See each app's own README for details.

All clients need `google.oauth.client-id` (backend) and their own Google
client ID config to match, or OAuth login will fail verification — see the
Google OAuth section of `docs/PROJECT_SPEC.md`. The real client ID
(`688656564041-...apps.googleusercontent.com`, a dedicated "MedTech
Platform" Web application client in project `vertexcodelabs` — not the
original shared client, which had a different app's redirect URIs) is
already set in the backend, all 6 Flutter apps, and `admin-web/.env.local`
(gitignored). The matching client **secret** is never stored anywhere in
this repo — the ID-token verification flow used here doesn't need it, only
the client ID (which is not secret; it's meant to be embedded in clients).

## Status

Not yet a git repository.
