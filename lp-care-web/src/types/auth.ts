export type UserRole = "PATIENT" | "OWNER"

export interface AuthUser {
  id: string
  role: UserRole
  fullName: string
  email: string
  avatarUrl?: string
}

export interface AuthSession {
  user: AuthUser
  accessToken: string
  refreshToken: string
}
