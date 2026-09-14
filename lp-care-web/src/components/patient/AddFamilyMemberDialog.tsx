import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { addFamilyMember } from "@/services/api/patientsApi"
import { errorMessage } from "@/lib/apiClient"
import type { FamilyMember, Gender } from "@/types"

const emptyForm = { fullName: "", relation: "", gender: "MALE" as Gender, dateOfBirth: "" }

interface AddFamilyMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded?: (familyMembers: FamilyMember[]) => void
}

export function AddFamilyMemberDialog({ open, onOpenChange, onAdded }: AddFamilyMemberDialogProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)

  const saveMutation = useMutation({
    mutationFn: () => addFamilyMember(form),
    onSuccess: (patient) => {
      queryClient.setQueryData(["currentPatient"], patient)
      toast.success("Family member added")
      setForm(emptyForm)
      onOpenChange(false)
      onAdded?.(patient.familyMembers)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add family member</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="fm-b-name">Full name</Label>
            <Input id="fm-b-name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fm-b-relation">Relation</Label>
              <Input id="fm-b-relation" placeholder="e.g. Father" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} required />
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
            <Label htmlFor="fm-b-dob">Date of birth</Label>
            <Input id="fm-b-dob" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Add member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
