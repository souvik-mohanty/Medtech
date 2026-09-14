# LP Care Pathology — MediLab Web

Frontend-only patient + owner portal for LP Care Pathology, a single-owner
pathology laboratory. Built to the "MediLab" specification: React + TypeScript
+ Vite, Tailwind v4, shadcn/ui, TanStack Query, Zustand, React Hook Form + Zod.

There is **no backend**. Every API call goes through an in-memory mock
service layer (`src/services/api/` + `src/services/mock/`) with simulated
network delay, so the app is fully runnable and demonstrable on its own.

## Run it

```bash
npm install
npm run dev
```

Runs on **http://localhost:5180** (pinned in `vite.config.ts`, not Vite's
default 5173) — that port is reserved for the unrelated `web/` project
elsewhere in this repo, whose Google OAuth client is only authorized for
`http://localhost:5173`.

Build: `npm run build`. Type-check + build must both pass before committing.

## Demo credentials (mock Google OAuth)

Login/Register both go through a single "Continue with Google" button that
opens a mock account-chooser (no real Google account or client ID is used
anywhere in this demo).

| Account                          | Role    | Behavior                          |
| --------------------------------- | ------- | ---------------------------------- |
| Dr. Laxmipriya Panda (`owner@lpcarepathology.in`) | Owner   | Pre-provisioned                    |
| Ananya Sharma (`ananya.sharma@example.com`)       | Patient | Returning patient, has seed data   |
| "Use another account" (any name/email)            | Patient | New patient — auto-provisioned on first sign-in, same as the real backend's Google OAuth rule |

## Structure

- `src/pages/public/` — marketing site (home, about, services, test/package
  catalog + detail, sample collection, contact)
- `src/pages/auth/` — mock Google OAuth login & register (`LoginPage.tsx`)
- `src/pages/patient/`, `src/pages/owner/` — the two portals
- `src/components/layouts/` — `PublicLayout`, `PatientLayout`, `OwnerLayout`
  (the latter two share `DashboardShell`)
- `src/components/ui/` — shadcn/ui primitives
- `src/components/charts/` — Recharts wrappers used on the owner dashboard
- `src/services/mock/` — static/seed mock data
- `src/services/api/` — mock "API" functions (async + artificial delay) the
  pages call through TanStack Query; this is the layer a real backend
  integration would replace
- `src/app/store/` — Zustand stores (`authStore` persisted, `bookingCartStore`
  for the in-progress booking flow)
- `src/app/router/` — `AppRouter` and route guards (`ProtectedRoute`,
  `RoleRoute`, `GuestOnlyRoute` — UX-only, not real security)

## Status

**Phase 1 complete**: project scaffold, design system, both dashboard shells,
full public website, mock Google OAuth login, patient profile/family
management, owner patient directory + detail, owner analytics dashboard, and
full routing — every nav item in both portals resolves to a real page, with
not-yet-built modules rendering a `ComingSoon` placeholder instead of a
broken link.

**Phase 2 complete**: patient-side test/package browsing with an
add-to-cart flow (`src/pages/patient/TestsPage.tsx`,
`src/pages/patient/PackagesPage.tsx`, `src/app/store/bookingCartStore.ts`,
`src/components/patient/CartSummaryBar.tsx`), the full 5-step booking wizard
— review → for whom (self/family) → collection method + address → date/slot
→ coupon + mock payment (`src/pages/patient/BookTestPage.tsx`) — which
creates a real booking against the in-memory mock store
(`bookingsApi.createBooking`) and shows up immediately in "My Bookings", and
a sample-collection tracker with a visual status timeline per booking
(`src/pages/patient/CollectionPage.tsx`).

**Not yet built** (Phases 3–5 of the spec): payments module (mock Razorpay,
payment history/receipts), invoices, lab reports, owner catalog management
(tests, packages, coupons), owner operational modules (bookings, collection,
reports, payments, invoices), notifications center, and settings.
