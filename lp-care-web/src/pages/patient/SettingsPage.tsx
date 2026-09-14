import { useState } from "react"
import { toast } from "sonner"
import { Loader2, LogOut } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { DashboardSectionCard } from "@/components/layouts/DashboardShell"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { useAuthStore } from "@/app/store/authStore"
import { useNavigate } from "react-router-dom"
import { mockDelay } from "@/lib/utils"

const PREFERENCES = [
  { key: "bookingUpdates", label: "Booking confirmations & status updates", defaultOn: true },
  { key: "collectionReminders", label: "Sample collection reminders", defaultOn: true },
  { key: "reportReady", label: "Report ready notifications", defaultOn: true },
  { key: "paymentReceipts", label: "Payment receipts & invoices", defaultOn: true },
  { key: "promotions", label: "Offers, coupons & health tips", defaultOn: false },
] as const

export function SettingsPage() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((s) => s.clearSession)
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(PREFERENCES.map((p) => [p.key, p.defaultOn])),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    await mockDelay(500)
    setIsSaving(false)
    toast.success("Preferences saved")
  }

  return (
    <div>
      <PageHeader title="Settings" description="Notification preferences and account settings." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Notification preferences</h2>
          <div className="space-y-3">
            {PREFERENCES.map((p) => (
              <label key={p.key} className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted/40">
                <Checkbox checked={prefs[p.key]} onCheckedChange={(v) => setPrefs((s) => ({ ...s, [p.key]: v === true }))} />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
          <Button className="mt-5" onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Save preferences
          </Button>
        </DashboardSectionCard>

        <DashboardSectionCard className="h-fit">
          <h2 className="mb-4 font-semibold">Account</h2>
          <p className="text-sm text-muted-foreground">Signed in with Google.</p>
          <Button variant="outline" className="mt-4 w-full" onClick={() => setLogoutOpen(true)}>
            <LogOut className="size-4" /> Log out
          </Button>
        </DashboardSectionCard>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Log out?"
        description="You'll need to sign in with Google again to continue."
        confirmLabel="Log out"
        destructive
        onConfirm={() => {
          clearSession()
          navigate("/login")
        }}
      />
    </div>
  )
}
