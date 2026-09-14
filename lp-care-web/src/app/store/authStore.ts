import { create } from "zustand"
import { persist } from "zustand/middleware"
import { TOKEN_STORAGE_KEY } from "@/lib/apiClient"
import type { AuthSession, AuthUser } from "@/types"

interface AuthState {
  session: AuthSession | null
  setSession: (session: AuthSession) => void
  updateUser: (update: Partial<AuthUser>) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => {
        // apiClient's request interceptor reads the JWT from this
        // dedicated key rather than parsing zustand's persisted blob.
        localStorage.setItem(TOKEN_STORAGE_KEY, session.accessToken)
        set({ session })
      },
      updateUser: (update) =>
        set((state) => (state.session ? { session: { ...state.session, user: { ...state.session.user, ...update } } } : state)),
      clearSession: () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        set({ session: null })
      },
    }),
    { name: "lp-care-auth" },
  ),
)
