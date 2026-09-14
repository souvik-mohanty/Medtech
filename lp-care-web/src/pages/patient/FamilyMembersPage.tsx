import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Pencil, Plus, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import {
  addFamilyMember,
  deleteFamilyMember,
  getCurrentPatient,
  updateFamilyMember,
} from "@/services/api/patientsApi"
import type { FamilyMember, Gender } from "@/types"
import { formatDate } from "@/lib/utils"

const emptyForm = { fullName: "", relation: "", gender: "MALE" as Gender, dateOfBirth: "" }

export function FamilyMembersPage() {
  const queryClient = useQueryClient()
  const { data: patient, isLoading } = useQuery({ queryKey: ["currentPatient"], queryFn: getCurrentPatient })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FamilyMember | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<FamilyMember | null>(null)

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(member: FamilyMember) {
    setEditing(member)
    setForm({ fullName: member.fullName, relation: member.relation, gender: member.gender, dateOfBirth: member.dateOfBirth })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => (editing ? updateFamilyMember(editing.id, form) : addFamilyMember(form)),
    onSuccess: (updated) => {
      queryClient.setQueryData(["currentPatient"], updated)
      toast.success(editing ? "Family member updated" : "Family member added")
      setDialogOpen(false)
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFamilyMember(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(["currentPatient"], updated)
      toast.success("Family member removed")
      setDeleteTarget(null)
    },
  })

  if (isLoading || !patient) {
    return (
      <div>
        <PageHeader title="Family Members" />
        <LoadingState rows={3} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Family Members"
        description="Book tests for family members without creating a separate account."
        actions={
          <Button onClick={openAdd}>
            <Plus className="size-4" /> Add family member
          </Button>
        }
      />

      {patient.familyMembers.length === 0 ? (
        <EmptyState icon={Users} title="No family members yet" description="Add a family member to book tests on their behalf." actionLabel="Add family member" onAction={openAdd} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patient.familyMembers.map((m) => (
            <div key={m.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{m.fullName}</p>
                  <p className="text-sm text-muted-foreground">{m.relation}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon-sm" variant="ghost" onClick={() => openEdit(m)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setDeleteTarget(m)}>
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {m.gender.charAt(0) + m.gender.slice(1).toLowerCase()} · Born {formatDate(m.dateOfBirth)}
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit family member" : "Add family member"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              saveMutation.mutate()
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="fm-name">Full name</Label>
              <Input id="fm-name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fm-relation">Relation</Label>
                <Input id="fm-relation" placeholder="e.g. Father" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as Gender })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fm-dob">Date of birth</Label>
              <Input id="fm-dob" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{editing ? "Save changes" : "Add member"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove family member?"
        description={`This will remove ${deleteTarget?.fullName} from your family members list.`}
        confirmLabel="Remove"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  )
}
