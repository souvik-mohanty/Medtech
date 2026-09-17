# LP Care Pathology

A full-stack lab management platform for LP Care Pathology, a pathology
laboratory. Patients browse and book lab tests, packages, and doctor
appointments online; the lab owner runs the whole business day-to-day —
billing, inventory, bookings, doctor schedules, coupons, referrals, and
reporting — from one dashboard.

**Live**: [lpcarepathology.vertexcodelabs.in](https://lpcarepathology.vertexcodelabs.in) (frontend) · [lpcare.onrender.com](https://lpcare.onrender.com) (backend API)

## Two apps, one product

| | Path | Stack |
|---|---|---|
| **Frontend** | [`lp-care-web/`](lp-care-web) | React 19 + TypeScript + Vite, Tailwind v4, shadcn/ui, TanStack Query, Zustand |
| **Backend** | [`medtech/`](medtech) | Spring Boot 3.2 (Java 21), Spring Security + JWT, PostgreSQL via Spring Data JPA, Flyway migrations |

There's no mobile app and no separate admin panel — one React client, gated
by role after login.

## Roles

- **Owner** — the lab's staff/receptionist account (internally `FRANCHISE`
  on the backend; the frontend translates this to `OWNER`). Provisioned
  directly in the database, not self-service. More than one login can be
  linked to the same lab (see `franchise_owner`).
- **Patient** — anyone signing in with Google. A first-time sign-in with an
  unrecognized email auto-provisions a new patient account; there's no
  separate registration flow.

Login is Google OAuth only (`@react-oauth/google` on the frontend, ID-token
verification on the backend) — no password auth anywhere.

## What's built

**Patient portal** — browse tests/packages and book them (5-step wizard:
review → for whom → collection method/address → schedule → coupon +
payment), book doctor appointments, order medicine, track sample
collection, view/download lab reports and invoices, manage profile/family
members/addresses, payment history.

**Owner dashboard** — billing (medicine sales + lab bookings), inventory
with expiry tracking and dashboard insights, lab test/package catalog with
per-test optional GST, bookings management (incl. edit/delete for
counter-entered bookings), **Express Billing** (walk-in counter billing
for lab tests, medicine, and doctor appointments — no patient login
required), doctor schedule management, coupons, referral tracking with
commission, a patient directory that groups every booking/order/
appointment by the same person even across visits (matched by account
email, or by name + phone for walk-ins with no account), payments and
pending-dues views, notifications, and invoice branding/settings.

## Backend module map (`medtech/src/main/java/com/company/medtech/`)

| Package | Owns |
|---|---|
| `auth/` | Google OAuth login + JWT issuance. First sign-in with an unknown email auto-provisions a patient; owner accounts are provisioned directly in the database. |
| `franchise/` | The lab's own profile (branding, invoice settings), payment gateway config, and multi-owner login support. |
| `inventory/` | Medicine/product catalog — pricing, stock, GST, expiry tracking, dashboard insights. |
| `billing/` | Medicine sales — counter (owner-entered, cash) and online patient orders. Bills are immutable once created. |
| `lab/` | Lab test/package catalog and bookings (patient-booked online or owner-entered at the counter), lab reports. |
| `consultation/` | Doctor visiting-window schedules and appointment booking/queueing. |
| `coupon/` | Franchise-scoped discount coupons, validated and redeemed server-side. |
| `referral/` | Referral sources (e.g. doctors) and their commission on bookings they send in. |
| `patient/` | Patient profile, family members, saved addresses, and the owner-facing patient directory. |
| `payment/` | Payment/payment-history records backing bookings and orders. |
| `notification/` | In-app notifications for both roles. Almost all of them are created by a direct, synchronous call from whatever service caused them — the one exception is a patient's own online lab booking, published as a Kafka event and consumed by `notification.listener.BookingEventListener` (see Async events below). |
| `common/`, `config/` | Shared constants/enums/exceptions, Spring Security + JWT + CORS configuration, Kafka topic declarations. |

Every domain follows the same shape: `model/` (JPA entities), `repository/`
(Spring Data interfaces), `service/` (business logic — money math always
happens here, never trusted from the client), `dto/`, `controller/`
(`/api/franchise/**` for the owner, `/api/patient/**` for patients).

## Frontend structure (`lp-care-web/src/`)

- `pages/public/` — marketing site (home, about, services, test/package
  catalog, sample collection, contact)
- `pages/auth/` — Google login
- `pages/patient/`, `pages/owner/` — the two portals, one page per feature
- `components/layouts/` — `PublicLayout`, `PatientLayout`, `OwnerLayout`
- `components/ui/` — shadcn/ui primitives
- `components/owner/`, `components/patient/` — feature-specific dialogs and
  widgets (e.g. Express Billing's walk-in dialogs)
- `services/api/` — one file per backend domain; every page goes through
  this layer via TanStack Query, never calling `apiClient` directly
- `app/store/` — Zustand stores (`authStore` persisted, `bookingCartStore`
  for the in-progress booking flow)
- `app/router/` — routes and role guards (`ProtectedRoute`, `RoleRoute`) —
  UX convenience only; the backend's own RBAC is the real security boundary

## Getting started

### Backend (`medtech/`)

Requires Java 21, Maven, and either Docker (for local Postgres) or a
hosted Postgres connection string.

```bash
cd medtech
# Local Postgres via Docker (port 5434 — see application.yml):
docker run --name medtech-postgres -e POSTGRES_DB=medtech \
  -e POSTGRES_USER=medtech -e POSTGRES_PASSWORD=medtech \
  -p 5434:5432 -d postgres:16

mvn spring-boot:run
```

Runs on **http://localhost:8080**. Flyway applies every migration
(`src/main/resources/db/migration/`) automatically on startup — there's no
separate migrate step. Run the test suite (H2 in-memory, no Postgres
needed) with `mvn clean test`.

To point at a hosted database instead (e.g. when Docker isn't available),
create a gitignored `application-local.yml` next to `application.yml` and
run with `-Dspring-boot.run.profiles=local`.

### Local infrastructure: Kafka + Prometheus + Grafana

```bash
docker compose up -d
```

Brings up Kafka (`localhost:29092` — not Kafka's usual 9092/9093, since
those can collide with another project's broker or Windows's own reserved
port ranges; see the comments in `docker-compose.yml`), Prometheus
(`localhost:9091`, scraping the backend's `/actuator/prometheus`), and
Grafana (`localhost:3000`, login `admin`/`admin`) with a "MedTech Backend"
dashboard already provisioned (JVM heap, HTTP request rate, DB connection
pool, CPU). Postgres is intentionally not part of this compose file — see
the note in `docker-compose.yml` for why.

The backend still starts and runs fine with none of this up — Kafka and
the metrics push are both best-effort (see Async events below).

### Frontend (`lp-care-web/`)

Requires Node.js.

```bash
cd lp-care-web
npm install
npm run dev
```

Runs on **http://localhost:5180** (pinned in `vite.config.ts`). Create
`.env.local` with:

```
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=<your Google OAuth web client ID>
```

`VITE_GOOGLE_CLIENT_ID` must match the backend's `google.oauth.client-id`
(`application.yml`) — a mismatch fails Google Sign-In outright. Add
`http://localhost:5180` to that OAuth client's authorized JavaScript
origins in Google Cloud Console.

Build with `npm run build` (runs `tsc -b` first — type errors fail the
build).

## Key conventions worth knowing before changing anything

- **The backend owns all money math.** Subtotals, discounts, GST, and
  totals are always computed server-side from current catalog data at
  booking/billing time and never trusted from the client. A completed
  bill/booking then *snapshots* the item name/price/GST it charged, so a
  later catalog price change never rewrites history.
- **GST is per-item, not a platform-wide rate.** Each product/test has its
  own optional GST percentage (defaults to 0) — there's no global tax rate
  hardcoded anywhere.
- **Bills are immutable once created** — there's no edit endpoint. Lab
  bookings entered at the counter (Express Billing) are the one exception:
  they can be edited or deleted, since they're the owner's own data entry
  and mistakes there are common.
- **Walk-in (Express Billing) customers have no login.** They're matched
  across visits by name + phone, or by whatever email the owner enters —
  see `PatientDirectoryService` for how records get grouped into one
  person even when different visits supplied different identifying
  details.
- **Almost everything notifies synchronously, on purpose** — see
  `NotificationService`'s class doc. The one deliberate exception is a
  patient's own online lab booking, which publishes a `BookingCreatedEvent`
  to Kafka (topic `booking-events`, see `config.KafkaTopicConfig` and
  `lab.service.BookingEventProducer`) instead of notifying directly; a
  consumer (`notification.listener.BookingEventListener`) reacts to it
  asynchronously. `KafkaTemplate#send` is fire-and-forget here — a slow or
  down broker delays the notification, never the patient's booking
  response.

## Deployment

- **Frontend** → Vercel, auto-deploys on push to `main`. Needs
  `VITE_API_BASE_URL` and `VITE_GOOGLE_CLIENT_ID` set as environment
  variables (a Vite env var is baked in at build time — changing it
  requires a redeploy, not just a save).
- **Backend** → Render, Docker-based web service (see `medtech/Dockerfile`),
  auto-deploys on push to `main`. Activate the `render` Spring profile via
  `SPRING_PROFILES_ACTIVE=render` and set `DB_URL`, `DB_USERNAME`,
  `DB_PASSWORD`, `DB_SCHEMA` — see `application-render.yml`. If the target
  Postgres instance is shared with another project, `DB_SCHEMA` keeps this
  app's tables confined to their own schema instead of the shared `public`
  one.
- **Database** → any Postgres instance (currently Neon).
- **Monitoring** → Render has no built-in Prometheus server to scrape, so
  the backend instead *pushes* metrics on a 30s interval straight to a
  hosted Grafana Cloud instance's OTLP endpoint (`management.otlp` in
  `application.yml`). Off by default — turn it on by setting
  `GRAFANA_CLOUD_OTLP_ENABLED=true`, `GRAFANA_CLOUD_OTLP_ENDPOINT`, and
  `GRAFANA_CLOUD_OTLP_TOKEN` as Render env vars (Grafana Cloud free tier:
  **Connections → Add new connection → OpenTelemetry (OTLP)** gives you
  both the endpoint URL and a ready-made Basic auth token). Local dev and
  the test suite never touch this — see the docker-compose Prometheus/
  Grafana setup above instead.
- **Kafka** → nothing hosted yet. `KAFKA_BOOTSTRAP_SERVERS` would need to
  point at an external hosted broker (e.g. Upstash Kafka, Confluent Cloud)
  before the live backend's booking-event flow does anything — until then,
  `KafkaTemplate#send` in production just fails silently in the background
  on every online booking (harmless, per the fire-and-forget note above,
  but the notification never gets recreated by any consumer).

## More documentation

[`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md) has the original product
requirements and business rules this platform was built against.
