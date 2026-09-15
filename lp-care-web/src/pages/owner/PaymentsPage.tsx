import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Check, CreditCard, IndianRupee, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/common/PageHeader"
import { StatCard } from "@/components/common/StatCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getOwnerBookings, markBookingCashPaid } from "@/services/api/bookingsApi"
import { getOwnerOrders, markOrderPaid } from "@/services/api/ordersApi"
import { getOwnerAppointments, markAppointmentPaid } from "@/services/api/appointmentsApi"
import { errorMessage } from "@/lib/apiClient"
import { formatCurrency, formatDateTime } from "@/lib/utils"

type Purpose = "Lab Booking" | "Medicine Order" | "Doctor Appointment"
type PaymentType = "Cash" | "Online"
type StatusBucket = "PENDING" | "PARTIALLY_PAID" | "PAID" | "FAILED" | "REFUNDED"

interface PaymentRow {
  id: string
  purpose: Purpose
  who: string
  type: PaymentType
  amount: number
  rawStatus: string
  bucket: StatusBucket
  createdAt: string
  markPaid?: () => Promise<unknown>
}

function bucketOf(rawStatus: string): StatusBucket {
  if (rawStatus === "PARTIALLY_PAID") return "PARTIALLY_PAID"
  if (["SUCCESS", "PAID", "CONFIRMED", "DISPATCHED", "DELIVERED"].includes(rawStatus)) return "PAID"
  if (["FAILED", "PAYMENT_FAILED", "CANCELLED"].includes(rawStatus)) return "FAILED"
  if (["REFUNDED", "PARTIALLY_REFUNDED"].includes(rawStatus)) return "REFUNDED"
  return "PENDING"
}

export function OwnerPaymentsPage() {
  const queryClient = useQueryClient()
  const [purpose, setPurpose] = useState<Purpose | "ALL">("ALL")
  const [type, setType] = useState<PaymentType | "ALL">("ALL")
  const [status, setStatus] = useState<StatusBucket | "ALL">("ALL")

  const { data: bookings, isLoading: loadingBookings } = useQuery({ queryKey: ["owner-bookings"], queryFn: () => getOwnerBookings() })
  const { data: orders, isLoading: loadingOrders } = useQuery({ queryKey: ["owner-orders"], queryFn: getOwnerOrders })
  const { data: appointments, isLoading: loadingAppointments } = useQuery({ queryKey: ["owner-doctor-appointments"], queryFn: getOwnerAppointments })

  const markPaidMutation = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["owner-orders"] })
      queryClient.invalidateQueries({ queryKey: ["owner-doctor-appointments"] })
      toast.success("Payment marked received")
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const allRows = useMemo<PaymentRow[]>(() => {
    const bookingRows: PaymentRow[] = (bookings ?? []).map((b) => ({
      id: b.id,
      purpose: "Lab Booking",
      who: b.patientName,
      // Bookings don't carry a payment method field — CASH is the only mode with a pending state worth flagging; anything already SUCCESS came in online or was confirmed in cash, both shown the same here.
      type: b.paymentStatus === "PENDING" || b.paymentStatus === "PARTIALLY_PAID" ? "Cash" : "Online",
      amount: b.totalAmount,
      rawStatus: b.paymentStatus,
      bucket: bucketOf(b.paymentStatus),
      createdAt: b.createdAt,
      markPaid: b.paymentStatus === "PENDING" ? () => markBookingCashPaid(b.id) : undefined,
    }))
    const orderRows: PaymentRow[] = (orders ?? []).map((o) => ({
      id: o.id,
      purpose: "Medicine Order",
      who: o.customerName ?? o.patientEmail ?? "Walk-in",
      type: o.paymentMode === "CASH" ? "Cash" : "Online",
      amount: o.totalAmount,
      rawStatus: o.status,
      bucket: bucketOf(o.status),
      createdAt: o.createdAt,
      markPaid: o.status === "PAYMENT_PENDING" ? () => markOrderPaid(o.id) : undefined,
    }))
    const appointmentRows: PaymentRow[] = (appointments ?? []).map((a) => ({
      id: a.id,
      purpose: "Doctor Appointment",
      who: a.patientEmail ?? a.customerName ?? "Walk-in",
      type: a.paymentMode === "CASH" ? "Cash" : "Online",
      amount: a.fee,
      rawStatus: a.status,
      bucket: bucketOf(a.status),
      createdAt: a.createdAt,
      markPaid: a.status === "PAYMENT_PENDING" ? () => markAppointmentPaid(a.id) : undefined,
    }))
    return [...bookingRows, ...orderRows, ...appointmentRows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [bookings, orders, appointments])

  const rows = allRows.filter(
    (r) => (purpose === "ALL" || r.purpose === purpose) && (type === "ALL" || r.type === type) && (status === "ALL" || r.bucket === status),
  )

  const stats = useMemo(() => {
    return {
      collected: allRows.filter((r) => r.bucket === "PAID").reduce((sum, r) => sum + r.amount, 0),
      pending: allRows.filter((r) => r.bucket === "PENDING" || r.bucket === "PARTIALLY_PAID").length,
      failed: allRows.filter((r) => r.bucket === "FAILED").length,
      refunded: allRows.filter((r) => r.bucket === "REFUNDED").length,
    }
  }, [allRows])

  const isLoading = loadingBookings || loadingOrders || loadingAppointments

  return (
    <div>
      <PageHeader title="Payments" description="Every transaction across your laboratory, pharmacy, and doctor appointments." />

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Collected" value={formatCurrency(stats.collected)} icon={IndianRupee} tone="success" />
        <StatCard label="Pending" value={String(stats.pending)} icon={CreditCard} tone="warning" />
        <StatCard label="Failed" value={String(stats.failed)} icon={CreditCard} tone="destructive" />
        <StatCard label="Refunded" value={String(stats.refunded)} icon={CreditCard} />
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <Select value={purpose} onValueChange={(v) => setPurpose(v as typeof purpose)}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All purposes</SelectItem>
            <SelectItem value="Lab Booking">Lab Booking</SelectItem>
            <SelectItem value="Medicine Order">Medicine Order</SelectItem>
            <SelectItem value="Doctor Appointment">Doctor Appointment</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Online">Online</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingState rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState title="No payments found" description="Try a different filter." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purpose</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const pending = markPaidMutation.isPending && markPaidMutation.variables === r.markPaid
                return (
                  <TableRow key={`${r.purpose}-${r.id}`}>
                    <TableCell><Badge variant="secondary">{r.purpose}</Badge></TableCell>
                    <TableCell className="font-medium">{r.who}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(r.createdAt)}</TableCell>
                    <TableCell className="text-sm">{r.type}</TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(r.amount)}</TableCell>
                    <TableCell><StatusBadge status={r.rawStatus} /></TableCell>
                    <TableCell>
                      {r.markPaid && (
                        <Button size="sm" onClick={() => markPaidMutation.mutate(r.markPaid!)} disabled={pending}>
                          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                          Mark received
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
