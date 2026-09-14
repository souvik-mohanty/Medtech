// Central place for environment-driven config. Override at build time with
// Vite env vars (e.g. .env.local: VITE_API_BASE_URL=http://localhost:8080).

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

// Must equal the backend's `google.oauth.client-id` (application.yml) so the
// ID token's `aud` claim passes backend verification.
export const GOOGLE_CLIENT_ID: string =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ?? 'CHANGE_ME_GOOGLE_OAUTH_CLIENT_ID';
