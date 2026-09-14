import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, MapPin, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/common/PageHeader"
import { DashboardSectionCard } from "@/components/layouts/DashboardShell"
import { LoadingState } from "@/components/common/LoadingState"
import { getCurrentPatient, updatePatientProfile } from "@/services/api/patientsApi"
import { AddAddressDialog } from "@/components/patient/AddAddressDialog"
import type { Gender } from "@/types"

export function PatientProfilePage() {
  const queryClient = useQueryClient()
  const { data: patient, isLoading } = useQuery({ queryKey: ["currentPatient"], queryFn: getCurrentPatient })

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [gender, setGender] = useState<Gender | "">("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [addAddressOpen, setAddAddressOpen] = useState(false)

  useEffect(() => {
    if (!patient) return
    setFullName(patient.fullName)
    setPhone(patient.phone)
    setEmail(patient.email ?? "")
    setGender(patient.gender ?? "")
    setDateOfBirth(patient.dateOfBirth ?? "")
  }, [patient])

  const updateMutation = useMutation({
    mutationFn: () =>
      updatePatientProfile({
        fullName,
        phone: phone || undefined,
        email: email || undefined,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["currentPatient"], updated)
      toast.success("Profile updated")
    },
    onError: () => toast.error("Couldn't update your profile. Please try again."),
  })

  if (isLoading || !patient) {
    return (
      <div>
        <PageHeader title="My Profile" />
        <LoadingState rows={4} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="My Profile" description="Manage your personal information and addresses." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr]">
        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Personal information</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateMutation.mutate()
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Required before booking a test" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dob">Date of birth</Label>
                <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </DashboardSectionCard>

        <DashboardSectionCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Saved addresses</h2>
            <Button size="sm" variant="outline" onClick={() => setAddAddressOpen(true)}>
              <Plus className="size-4" /> Add address
            </Button>
          </div>
          <div className="space-y-3">
            {patient.addresses.length === 0 && (
              <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
            )}
            {patient.addresses.map((addr) => (
              <div key={addr.id} className="flex items-start gap-3 rounded-lg border p-4">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{addr.label}</p>
                    {addr.isDefault && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} – {addr.pincode}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DashboardSectionCard>
      </div>

      <AddAddressDialog open={addAddressOpen} onOpenChange={setAddAddressOpen} />
    </div>
  )
}
