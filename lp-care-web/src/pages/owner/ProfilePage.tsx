import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PageHeader } from "@/components/common/PageHeader"
import { DashboardSectionCard } from "@/components/layouts/DashboardShell"
import { useAuthStore } from "@/app/store/authStore"
import { mockDelay } from "@/lib/utils"

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")
}

export function OwnerProfilePage() {
  const session = useAuthStore((s) => s.session)
  const updateUser = useAuthStore((s) => s.updateUser)
  const [fullName, setFullName] = useState(session?.user.fullName ?? "")
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    await mockDelay(500)
    updateUser({ fullName })
    setIsSaving(false)
    toast.success("Profile updated")
  }

  return (
    <div>
      <PageHeader title="Profile" description="Your own account details." />

      <DashboardSectionCard className="max-w-md">
        <div className="mb-5 flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="bg-primary text-lg text-primary-foreground">{initials(fullName || "Owner")}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{session?.user.fullName}</p>
            <p className="text-sm text-muted-foreground">{session?.user.email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="o-name">Full name</Label>
            <Input id="o-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="o-email">Email</Label>
            <Input id="o-email" value={session?.user.email ?? ""} disabled />
          </div>
        </div>
        <Button className="mt-5" onClick={handleSave} disabled={isSaving || !fullName.trim()}>
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </Button>
      </DashboardSectionCard>
    </div>
  )
}
