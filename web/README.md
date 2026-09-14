# MedTech Web

React + TypeScript + Vite. The platform's only client — a single unified
web app for both roles, Google Sign-In only (see
[docs/PROJECT_SPEC.md](../docs/PROJECT_SPEC.md) for the full login policy):

- **Patient** — auto-provisioned on first sign-in. The home page
  auto-detects the one active franchise (`GET /api/patient/franchises`) —
  no franchise ID ever typed in — then: order medicine, book a lab test or
  combo package, book a doctor appointment.
- **Franchise** (shop owner) — provisioned directly in Postgres, not
  through this app (there is deliberately no "become a shop owner" flow —
  see the root `CLAUDE.md`). Handles billing (counter sales + invoices,
  per-bill discount/note), inventory (incl. dashboard insights: stock
  value, expiring-soon/expired alerts), lab test catalog + bookings, doctor
  appointment schedules + bookings, invoice branding, and payment gateway
  config — doctor appointments, delivery, and lab reports are all operated
  by the shop owner directly rather than by separate logged-in staff
  accounts.

Routing is role-gated client-side (`src/auth/RoleRoute.tsx`); the backend's
own `/api/franchise/**` / `/api/patient/**` RBAC (see `SecurityConfig`) is
the real security boundary.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:
- `VITE_API_BASE_URL` — the backend's base URL (defaults to `http://localhost:8080`)
- `VITE_GOOGLE_CLIENT_ID` — must equal the backend's `google.oauth.client-id`
  (`medtech/src/main/resources/application.yml`), otherwise the ID token's
  `aud` claim will fail backend verification

The backend's `cors.allowed-origins` (same `application.yml`) already
includes `http://localhost:5173`, Vite's default dev port.

## Run

```bash
npm run dev
```

## Structure

- `src/config.ts` — env-driven config (API base URL, Google client ID)
- `src/api/client.ts` — axios instance, attaches the JWT from `localStorage`
- `src/api/franchiseApi.ts` / `src/api/patientApi.ts` — typed calls into the
  backend's `/api/franchise/**` and `/api/patient/**` endpoints
- `src/auth/AuthContext.tsx` — login/logout, session persistence
- `src/auth/ProtectedRoute.tsx` / `RoleRoute.tsx` — auth and role gating
- `src/components/AppLayout.tsx` — shared header + role-aware nav
- `src/pages/LoginPage.tsx` — Google Sign-In
- `src/pages/patient/useActiveFranchise.ts` — shared hook every patient
  page uses to resolve the one active franchise instead of asking for an ID
- `src/pages/shop-owner/` — Dashboard, Billing, Inventory, Lab Tests, Lab
  Bookings, Doctor Schedules, Doctor Appointments, Branding, Payment
  Gateway
- `src/pages/patient/` — Home (availability summary), Browse/PlaceOrder
  (medicine), BookLabTest, BookDoctorAppointment

**Known backend gap, not introduced here:** there's no order-history
endpoint, so a placed medicine order only shows an immediate confirmation,
not a persisted history view (lab test and doctor appointment bookings, by
contrast, are listed for the owner via their own bookings/appointments
endpoints).
