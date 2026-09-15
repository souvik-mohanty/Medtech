import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Pencil, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getPatientSummaries, updatePatientDetails, type PatientUpdateInput } from "@/services/api/patientsApi"
import { errorMessage } from "@/lib/apiClient"
import { formatDate } from "@/lib/utils"
import type { PatientSummary } from "@/types"

const PAGE_SIZE = 8

export function OwnerPatientsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")
  const [page, setPage] = useState(1)
  const [editTarget, setEditTarget] = useState<PatientSummary | null>(null)
  const [editForm, setEditForm] = useState<PatientUpdateInput>({})

  const { data, isLoading } = useQuery({
    queryKey: ["owner-patients", search, status],
    queryFn: () => getPatientSummaries({ search, status }),
  })

  const totalPages = Math.max(1, Math.ceil((data?.length ?? 0) / PAGE_SIZE))
  const pageItems = useMemo(() => (data ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [data, page])

  function openEdit(p: PatientSummary) {
    setEditTarget(p)
    setEditForm({ fullName: p.fullName, phone: p.phone, email: p.email ?? "" })
  }

  const updateMutation = useMutation({
    mutationFn: () => updatePatientDetails(editTarget!.id, editForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-patients"] })
      toast.success("Patient details updated")
      setEditTarget(null)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  return (
    <div>
      <PageHeader title="Patients" description="Everyone who has registered or booked with your laboratory." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email…"
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingState rows={6} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No patients found" description="Try a different search term or filter." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Appointments</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.fullName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.phone}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.email ?? "—"}</TableCell>
                    <TableCell className="text-sm">{p.totalBookings}</TableCell>
                    <TableCell className="text-sm">{p.totalOrders}</TableCell>
                    <TableCell className="text-sm">{p.totalAppointments}</TableCell>
                    <TableCell className="text-sm">{p.lastActivityDate ? formatDate(p.lastActivityDate) : "—"}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/owner/patients/${p.id}`}>View</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="px-2 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit patient details</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                updateMutation.mutate()
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="ep-name">Full name</Label>
                <Input id="ep-name" value={editForm.fullName ?? ""} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ep-phone">Phone</Label>
                <Input id="ep-phone" value={editForm.phone ?? ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ep-email">Email</Label>
                <Input id="ep-email" type="email" value={editForm.email ?? ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                {editTarget.email && (
                  <p className="text-xs text-muted-foreground">
                    This patient has an account — this updates their contact email only, not the one they sign in with.
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
