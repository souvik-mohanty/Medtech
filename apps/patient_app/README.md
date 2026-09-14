# MedTech Patient App

Login: Google OAuth only (no franchise scoping). See
[docs/PROJECT_SPEC.md](../../docs/PROJECT_SPEC.md) for the full login policy
by role.

Auth flow + one real feature: browse a franchise's product catalog and place
an online order (`lib/features/orders/franchise_products_screen.dart`),
against the backend's `/api/patient/franchises/{id}/products` and
`/api/patient/orders`. There's no franchise directory/search endpoint yet,
so the franchise is entered by ID. Orders land as `PAYMENT_PENDING` — there's
no payment gateway checkout wired up client-side yet (the backend rejects
the order outright if the franchise hasn't configured one). No other feature
screens (doctor browsing, appointment booking, etc.) yet.

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
- `lib/features/auth/login_screen.dart`, `lib/features/home/home_screen.dart`
- `lib/core/order_service.dart`, `lib/models/product.dart`,
  `lib/models/order_result.dart`,
  `lib/features/orders/franchise_products_screen.dart` — the ordering flow
