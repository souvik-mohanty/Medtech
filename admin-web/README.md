# MedTech Admin (Super Admin webpage)

React + TypeScript + Vite. Google Sign-In only, restricted client-side to
`ADMIN` and `CUSTOMER_SUPPORT` accounts (see
[docs/PROJECT_SPEC.md](../docs/PROJECT_SPEC.md) for the full login policy).

Real feature: **Subscription Plans** — create a plan (name, price, which
service modules it includes), list existing plans, deactivate/reactivate
them. Catalog management only — there's no link yet from a plan to a
specific franchise, and the plan's features aren't enforced anywhere (the
Doctor Appointment and Lab modules they'd gate don't exist yet either).

Everything else (franchise onboarding, pricing/commission control, coupon
management, global analytics, audit logs) is still a placeholder.

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
- `src/auth/` — `AuthContext` (login/logout, session persistence),
  `ProtectedRoute`
- `src/pages/LoginPage.tsx` — Google Sign-In button
- `src/components/AppLayout.tsx` — shared header (sign out) + nav, used by
  every page after login
- `src/pages/DashboardPage.tsx` — placeholder landing page after login
- `src/pages/SubscriptionPlansPage.tsx` — the real feature; API calls live
  in `src/api/subscriptionPlans.ts`
