import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/app/store/authStore"
import type { UserRole } from "@/types"

/**
 * Route protection here is for UX only (hide nav a role shouldn't see, land
 * people on a sensible screen) — the real Spring Security backend is the
 * actual authorization boundary once it exists.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const session = useAuthStore((s) => s.session)
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}

export function RoleRoute({ role, children }: { role: UserRole; children: ReactNode }) {
  const session = useAuthStore((s) => s.session)

  if (!session) return <Navigate to="/login" replace />
  if (session.user.role !== role) {
    return <Navigate to={session.user.role === "OWNER" ? "/owner" : "/patient"} replace />
  }
  return <>{children}</>
}

export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const session = useAuthStore((s) => s.session)
  if (session) {
    return <Navigate to={session.user.role === "OWNER" ? "/owner" : "/patient"} replace />
  }
  return <>{children}</>
}
