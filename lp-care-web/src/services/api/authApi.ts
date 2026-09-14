import { apiClient } from "@/lib/apiClient"
import type { AuthSession, AuthUser, UserRole } from "@/types"

/**
 * Real Google OAuth — the backend verifies the Google ID token, issues its
 * own JWT, and returns the caller's role. The backend's internal role name
 * is FRANCHISE (this repo's franchise-medicine platform still uses that
 * name everywhere else) — this is the one place it's translated to this
 * app's OWNER for the lab-owner role.
 */
interface BackendAuthResponse {
  token: string
  role: "FRANCHISE" | "PATIENT"
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
}

function toUserRole(backendRole: "FRANCHISE" | "PATIENT"): UserRole {
  return backendRole === "FRANCHISE" ? "OWNER" : "PATIENT"
}

export async function loginWithGoogleIdToken(idToken: string): Promise<AuthSession> {
  const response = await apiClient.post<{ data: BackendAuthResponse }>("/api/auth/oauth/google", { idToken })
  const data = response.data.data

  const user: AuthUser = {
    id: data.id,
    role: toUserRole(data.role),
    fullName: data.fullName ?? data.email,
    email: data.email,
    avatarUrl: data.avatarUrl ?? undefined,
  }

  // The backend issues a single JWT with no refresh-token concept (24h
  // expiry, no rotation) — refreshToken is a placeholder duplicate of the
  // access token so a hard 24h logout is the accepted behavior for now.
  return { user, accessToken: data.token, refreshToken: data.token }
}

export async function logout(): Promise<void> {
  // Stateless JWT — nothing to revoke server-side, this is purely a local
  // session teardown (handled by authStore#clearSession).
}
