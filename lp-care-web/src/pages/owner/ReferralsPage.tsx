import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { createReferral, getReferrals, settleReferral, toggleReferralActive, updateReferral, type ReferralInput } from "@/services/api/referralsApi"
import { errorMessage } from "@/lib/apiClient"
import { formatCurrency } from "@/lib/utils"
import type { CommissionType, Referral, ReferralType } from "@/types"

const emptyForm: ReferralInput = { name: "", type: "DOCTOR", phone: "", commissionType: "PERCENTAGE", commissionValue: 0 }

export function OwnerReferralsPage() {
  const queryClient = useQueryClient()
  const { data: referrals, isLoading } = useQuery({ queryKey: ["referrals"], queryFn: getReferrals })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Referral | null>(null)
  const [form, setForm] = useState<ReferralInput>(emptyForm)
  const [settleTarget, setSettleTarget] = useState<Referral | null>(null)
  const [settleAmount, setSettleAmount] = useState("")

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(referral: Referral) {
    setEditing(referral)
    setForm({
      name: referral.name,
      type: referral.type,
      phone: referral.phone ?? "",
      commissionType: referral.commissionType,
      commissionValue: referral.commissionValue,
    })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => (editing ? updateReferral(editing.id, form) : createReferral(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] })
      toast.success(editing ? "Referral updated" : "Referral added")
      setDialogOpen(false)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleReferralActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] })
      toast.success("Referral updated")
    },
  })

  const settleMutation = useMutation({
    mutationFn: () => settleReferral(settleTarget!.id, Number(settleAmount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] })
      toast.success("Settlement recorded")
      setSettleTarget(null)
      setSettleAmount("")
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  return (
    <div>
      <PageHeader
        title="Referral Management"
        description="Doctors and others who refer patients to you, and the commission each one earns."
        actions={
          <Button onClick={openAdd}>
            <Plus className="size-4" /> Add referral
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState rows={5} />
      ) : !referrals || referrals.length === 0 ? (
        <EmptyState icon={Users} title="No referrals yet" description="Add a doctor or anyone else who refers patients to you." actionLabel="Add referral" onAction={openAdd} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Earned</TableHead>
                <TableHead>Settled</TableHead>
                <TableHead>Balance due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.type === "DOCTOR" ? "Doctor" : "Other"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.phone || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {r.commissionType === "PERCENTAGE" ? `${r.commissionValue}%` : formatCurrency(r.commissionValue)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{formatCurrency(r.totalEarned)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatCurrency(r.settledAmount)}</TableCell>
                  <TableCell className="text-sm font-medium">
                    <span className={r.balanceDue > 0 ? "text-warning-foreground" : ""}>{formatCurrency(r.balanceDue)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.active ? "secondary" : "outline"} className={r.active ? "text-success" : "text-muted-foreground"}>
                      {r.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    {r.balanceDue > 0 && (
                      <Button size="sm" onClick={() => { setSettleTarget(r); setSettleAmount("") }}>
                        Settle
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Edit</Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={toggleMutation.isPending && toggleMutation.variables === r.id}
                      onClick={() => toggleMutation.mutate(r.id)}
                    >
                      {r.active ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit referral" : "Add referral"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              saveMutation.mutate()
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="rf-name">Name</Label>
              <Input id="rf-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ReferralType })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOCTOR">Doctor</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rf-phone">Phone (optional)</Label>
                <Input id="rf-phone" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Commission type</Label>
                <Select value={form.commissionType} onValueChange={(v) => setForm({ ...form, commissionType: v as CommissionType })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FLAT">Flat amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rf-commission">
                  Commission {form.commissionType === "PERCENTAGE" ? "(%)" : "(₹)"}
                </Label>
                <Input
                  id="rf-commission"
                  type="number"
                  min={0}
                  value={form.commissionValue}
                  onChange={(e) => setForm({ ...form, commissionValue: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {editing ? "Save changes" : "Add referral"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!settleTarget} onOpenChange={(open) => !open && setSettleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record settlement</DialogTitle>
          </DialogHeader>
          {settleTarget && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                settleMutation.mutate()
              }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                {formatCurrency(settleTarget.settledAmount)} of {formatCurrency(settleTarget.totalEarned)} settled so far —{" "}
                {formatCurrency(settleTarget.balanceDue)} still owed to {settleTarget.name}.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="settle-amount">Amount paid now</Label>
                <Input
                  id="settle-amount"
                  type="number"
                  min={1}
                  max={settleTarget.balanceDue}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSettleTarget(null)}>Cancel</Button>
                <Button type="submit" disabled={settleMutation.isPending || !settleAmount || Number(settleAmount) <= 0}>
                  {settleMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  Record settlement
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
