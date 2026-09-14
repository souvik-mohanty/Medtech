# MedTech Franchise Owner App

Login: Google OAuth only (no franchise scoping — the owner IS the
franchise). See [docs/PROJECT_SPEC.md](../../docs/PROJECT_SPEC.md) for the
full login policy by role.

Auth flow + a 4-tab dashboard wired to the real backend:

- **Billing** — pick products from inventory, create a counter bill (paid
  cash, invoiced immediately), then print it via the `printing` package's
  print/preview dialog, fed the PDF bytes from
  `GET /api/franchise/billing/bills/{id}/invoice`.
- **Inventory** — list + add products (`/api/franchise/inventory/products`).
- **Branding** — logo URL, accent color, font, footer note, GSTIN/contact
  (`GET`/`PUT /api/franchise/profile`).
- **Payments** — configure or disable the franchise's own Razorpay/PhonePe
  credentials (`/api/franchise/payment-gateway`). Until configured, the
  backend rejects all online orders for this franchise — cash only.

No staff management, finance reports, or doctor/staff scheduling screens yet
— those backend modules don't exist.

## One-time setup

This folder was hand-written (no Flutter SDK available in the environment
that generated it) — it has `pubspec.yaml` and `lib/`, but no platform
folders yet. Once Flutter is installed:

```bash
flutter create . --platforms=android,ios --org com.company.medtech
flutter pub get
```

`flutter create .` on a directory that already has `pubspec.yaml`/`lib/`
only adds the missing platform folders — it will not overwrite existing code.

Then configure Google Sign-In per platform (Android `google-services.json`,
iOS `GoogleService-Info.plist` / URL scheme) following
https://pub.dev/packages/google_sign_in, and set
`lib/core/app_config.dart#googleServerClientId` to the backend's
`google.oauth.client-id` (`medtech/src/main/resources/application.yml`) —
they must match or the backend will reject the ID token.

## Run

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8080
```

`10.0.2.2` is the Android emulator's alias for the host machine's
`localhost`. Use `http://localhost:8080` for iOS simulator / desktop / web.

## Structure

- `lib/core/app_config.dart` — role name + whether login requires a
  franchise ID (the only file that differs in substance between the 6 apps)
- `lib/core/api_client.dart` — Dio HTTP client
- `lib/core/auth_service.dart` — Google sign-in, calls the backend's
  `/api/auth/oauth/google`
- `lib/core/auth_controller.dart` — auth state (`ChangeNotifier`, via
  `provider`)
- `lib/core/token_storage.dart` — JWT persistence (`flutter_secure_storage`)
- `lib/theme/app_theme.dart` — placeholder theme, single point to swap in
  the shared design system later
- `lib/features/auth/login_screen.dart`
- `lib/features/home/home_screen.dart` — 4-tab `NavigationBar` shell
- `lib/features/franchise/` — `billing_screen.dart`, `inventory_screen.dart`,
  `branding_screen.dart`, `payment_gateway_screen.dart`
- `lib/core/` — `billing_service.dart`, `product_service.dart`,
  `franchise_service.dart`, `payment_gateway_service.dart`, `api_error.dart`
  (shared Dio-error-to-message helper)
- `lib/models/` — `bill.dart`, `product.dart`, `franchise_profile.dart`,
  `payment_gateway_status.dart`
