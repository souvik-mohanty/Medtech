import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { FlaskConical, Pencil, Plus, ShoppingBag, Stethoscope, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/common/PageHeader"
import { DashboardSectionCard } from "@/components/layouts/DashboardShell"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { WalkInBookingDialog } from "@/components/owner/WalkInBookingDialog"
import { WalkInMedicinePurchaseDialog } from "@/components/owner/WalkInMedicinePurchaseDialog"
import { WalkInDoctorAppointmentDialog } from "@/components/owner/WalkInDoctorAppointmentDialog"
import { deleteWalkInBooking, getOwnerBookings } from "@/services/api/bookingsApi"
import { getOwnerOrders } from "@/services/api/ordersApi"
import { getOwnerAppointments } from "@/services/api/appointmentsApi"
import { errorMessage } from "@/lib/apiClient"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import type { Booking } from "@/types"

interface WalkInRow {
  id: string
  kind: "Lab Test" | "Medicine" | "Doctor Appointment"
  who: string
  summary: string
  amount: number
  createdAt: string
  referralName?: string
}

export function OwnerWalkInPage() {
  const queryClient = useQueryClient()
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Booking | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null)

  const { data: bookings, isLoading: loadingBookings } = useQuery({ queryKey: ["owner-bookings"], queryFn: () => getOwnerBookings() })
  const { data: orders, isLoading: loadingOrders } = useQuery({ queryKey: ["owner-orders"], queryFn: getOwnerOrders })
  const { data: appointments, isLoading: loadingAppointments } = useQuery({ queryKey: ["owner-doctor-appointments"], queryFn: getOwnerAppointments })

  const rows = useMemo<WalkInRow[]>(() => {
    const bookingRows: WalkInRow[] = (bookings ?? [])
      .filter((b) => b.source === "FRANCHISE_COUNTER")
      .map((b) => ({
        id: b.id,
        kind: "Lab Test",
        who: b.patientName,
        summary: b.packageName ?? b.items.map((i) => i.testName).join(", "),
        amount: b.totalAmount,
        createdAt: b.createdAt,
        referralName: b.referralName,
      }))
    const orderRows: WalkInRow[] = (orders ?? [])
      .filter((o) => o.source === "FRANCHISE_COUNTER")
      .map((o) => ({
        id: o.id,
        kind: "Medicine",
        who: o.customerName ?? "Express",
        summary: o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", "),
        amount: o.totalAmount,
        createdAt: o.createdAt,
        referralName: o.referralName,
      }))
    const appointmentRows: WalkInRow[] = (appointments ?? [])
      .filter((a) => a.customerName != null)
      .map((a) => ({
        id: a.id,
        kind: "Doctor Appointment",
        who: a.customerName ?? "Express",
        summary: `${a.doctorName}${a.serialNumber !== undefined ? ` · Serial #${a.serialNumber}` : ""}`,
        amount: a.fee,
        createdAt: a.createdAt,
      }))
    return [...bookingRows, ...orderRows, ...appointmentRows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [bookings, orders, appointments])

  const isLoading = loadingBookings || loadingOrders || loadingAppointments

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWalkInBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["owner-collection"] })
      toast.success("Express booking deleted")
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  return (
    <div>
      <PageHeader title="Express Billing" description="Bill Express customers for a lab test or a medicine purchase, right at the counter." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardSectionCard className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FlaskConical className="size-5" />
            </div>
            <div>
              <p className="font-medium">Lab test booking</p>
              <p className="text-xs text-muted-foreground">Book a test or package for an Express Billing patient.</p>
            </div>
          </div>
          <Button onClick={() => setBookingDialogOpen(true)}>
            <Plus className="size-4" /> New
          </Button>
        </DashboardSectionCard>

        <DashboardSectionCard className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <p className="font-medium">Medicine purchase</p>
              <p className="text-xs text-muted-foreground">Sell medicines or equipment at the counter.</p>
            </div>
          </div>
          <Button onClick={() => setPurchaseDialogOpen(true)}>
            <Plus className="size-4" /> New
          </Button>
        </DashboardSectionCard>

        <DashboardSectionCard className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Stethoscope className="size-5" />
            </div>
            <div>
              <p className="font-medium">Doctor appointment</p>
              <p className="text-xs text-muted-foreground">Book a doctor's schedule for an Express Billing patient.</p>
            </div>
          </div>
          <Button onClick={() => setAppointmentDialogOpen(true)}>
            <Plus className="size-4" /> New
          </Button>
        </DashboardSectionCard>
      </div>

      <h2 className="mt-8 mb-4 font-semibold">Recent Express bills</h2>
      {isLoading ? (
        <LoadingState rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="No Express bills yet" description="Express bookings and purchases will show up here." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const booking = r.kind === "Lab Test" ? bookings?.find((b) => b.id === r.id) : undefined
                return (
                  <TableRow key={`${r.kind}-${r.id}`}>
                    <TableCell><Badge variant="secondary">{r.kind}</Badge></TableCell>
                    <TableCell className="text-sm">
                      {r.who}
                      {r.referralName && <p className="mt-0.5 text-xs text-muted-foreground">Ref: {r.referralName}</p>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.summary}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(r.createdAt)}</TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(r.amount)}</TableCell>
                    <TableCell>
                      {booking && (
                        <div className="flex items-center gap-1">
                          <Button size="icon-sm" variant="ghost" title="Edit booking" onClick={() => setEditTarget(booking)}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" title="Delete booking" onClick={() => setDeleteTarget(booking)}>
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <WalkInBookingDialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen} />
      <WalkInMedicinePurchaseDialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen} />
      <WalkInDoctorAppointmentDialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen} />

      <WalkInBookingDialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        editingBooking={editTarget}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this Express booking?"
        description="This permanently removes the booking, its payment record, and any uploaded report. This cannot be undone."
        confirmLabel="Delete"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  )
}
