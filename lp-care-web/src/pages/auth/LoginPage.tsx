import { Link, useLocation, useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { GoogleLogin } from "@react-oauth/google"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Logo } from "@/components/common/Logo"
import { useAuthStore } from "@/app/store/authStore"
import { loginWithGoogleIdToken } from "@/services/api/authApi"
import { errorMessage } from "@/lib/apiClient"

export function LoginPage({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)

  const signInMutation = useMutation({
    mutationFn: (idToken: string) => loginWithGoogleIdToken(idToken),
    onSuccess: (session) => {
      setSession(session)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? (session.user.role === "OWNER" ? "/owner" : "/patient"), { replace: true })
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>

        <div className="rounded-2xl border bg-card p-7 shadow-sm">
          <h1 className="text-xl font-bold">{mode === "login" ? "Login" : "Get started"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with your Google account — no password to remember.
          </p>

          <div className="mt-6 flex justify-center">
            {signInMutation.isPending ? (
              <div className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Signing in…
              </div>
            ) : (
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    signInMutation.mutate(credentialResponse.credential)
                  }
                }}
                onError={() => toast.error("Google sign-in failed. Please try again.")}
              />
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>New here? <Link to="/register" className="font-medium text-primary hover:underline">Create an account</Link></>
          ) : (
            <>Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Login</Link></>
          )}
        </p>
      </div>
    </div>
  )
}
