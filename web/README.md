# MedTech Web

React + TypeScript + Vite. The platform's only client — a single unified
web app for both remaining roles, Google Sign-In only (see
[docs/PROJECT_SPEC.md](../docs/PROJECT_SPEC.md) for the full login policy):

- **Patient** — auto-provisioned on first sign-in. Browses a shop's catalog
  (given its franchise ID) and places an online order.
- **Franchise** (shop owner) — reached only via self-onboarding: a Patient
  fills in the "Become a Shop Owner" form once, which promotes their
  account and creates their shop. Handles billing (counter sales +
  invoices), inventory, invoice branding, and payment gateway config —
  doctor appointments, delivery, and lab reports are handled by the shop
  owner directly rather than by separate logged-in staff accounts.

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
- `src/auth/AuthContext.tsx` — login/logout, session persistence;
  `setSession` lets the onboarding flow hot-swap the JWT after a Patient
  becomes a Franchise (their old token still has the pre-onboarding role
  baked in)
- `src/auth/ProtectedRoute.tsx` / `RoleRoute.tsx` — auth and role gating
- `src/components/AppLayout.tsx` — shared header + role-aware nav
- `src/pages/LoginPage.tsx` — Google Sign-In
- `src/pages/shop-owner/` — Onboarding, Dashboard, Billing, Inventory,
  Branding, Payment Gateway
- `src/pages/patient/` — Browse (enter a franchise ID, build a cart),
  PlaceOrder (review + submit)

**Known backend gaps, not introduced here:** there's no "list all shops"
endpoint, so a patient needs a franchise ID/link in hand rather than
browsing all shops; there's no order-history endpoint, so a placed order
only shows an immediate confirmation, not a persisted history view.
