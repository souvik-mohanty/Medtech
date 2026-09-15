import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getMyBookings } from "@/services/api/bookingsApi"
import { getMyOrders } from "@/services/api/ordersApi"
import { getMyAppointments } from "@/services/api/appointmentsApi"
import { formatCurrency, formatDateTime } from "@/lib/utils"

type Purpose = "Lab Booking" | "Medicine Order" | "Doctor Appointment"
type PaymentType = "Cash" | "Online"
type StatusBucket = "PENDING" | "PARTIALLY_PAID" | "PAID" | "FAILED" | "REFUNDED"

interface PaymentRow {
  id: string
  purpose: Purpose
  type: PaymentType
  amount: number
  rawStatus: string
  bucket: StatusBucket
  createdAt: string
}

function bucketOf(rawStatus: string): StatusBucket {
  if (rawStatus === "PARTIALLY_PAID") return "PARTIALLY_PAID"
  if (["SUCCESS", "PAID", "CONFIRMED", "DISPATCHED", "DELIVERED"].includes(rawStatus)) return "PAID"
  if (["FAILED", "PAYMENT_FAILED", "CANCELLED"].includes(rawStatus)) return "FAILED"
  if (["REFUNDED", "PARTIALLY_REFUNDED"].includes(rawStatus)) return "REFUNDED"
  return "PENDING"
}

export function PatientPaymentsPage() {
  const [purpose, setPurpose] = useState<Purpose | "ALL">("ALL")
  const [type, setType] = useState<PaymentType | "ALL">("ALL")
  const [status, setStatus] = useState<StatusBucket | "ALL">("ALL")

  const { data: bookings, isLoading: loadingBookings } = useQuery({ queryKey: ["bookings", "mine"], queryFn: getMyBookings })
  const { data: orders, isLoading: loadingOrders } = useQuery({ queryKey: ["orders", "mine"], queryFn: getMyOrders })
  const { data: appointments, isLoading: loadingAppointments } = useQuery({ queryKey: ["appointments", "mine"], queryFn: getMyAppointments })

  const allRows = useMemo<PaymentRow[]>(() => {
    const bookingRows: PaymentRow[] = (bookings ?? []).map((b) => ({
      id: b.id,
      purpose: "Lab Booking",
      type: b.paymentStatus === "PENDING" || b.paymentStatus === "PARTIALLY_PAID" ? "Cash" : "Online",
      amount: b.totalAmount,
      rawStatus: b.paymentStatus,
      bucket: bucketOf(b.paymentStatus),
      createdAt: b.createdAt,
    }))
    const orderRows: PaymentRow[] = (orders ?? []).map((o) => ({
      id: o.id,
      purpose: "Medicine Order",
      type: o.paymentMode === "CASH" ? "Cash" : "Online",
      amount: o.totalAmount,
      rawStatus: o.status,
      bucket: bucketOf(o.status),
      createdAt: o.createdAt,
    }))
    const appointmentRows: PaymentRow[] = (appointments ?? []).map((a) => ({
      id: a.id,
      purpose: "Doctor Appointment",
      type: a.paymentMode === "CASH" ? "Cash" : "Online",
      amount: a.fee,
      rawStatus: a.status,
      bucket: bucketOf(a.status),
      createdAt: a.createdAt,
    }))
    return [...bookingRows, ...orderRows, ...appointmentRows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [bookings, orders, appointments])

  const rows = allRows.filter(
    (r) => (purpose === "ALL" || r.purpose === purpose) && (type === "ALL" || r.type === type) && (status === "ALL" || r.bucket === status),
  )

  const isLoading = loadingBookings || loadingOrders || loadingAppointments

  return (
    <div>
      <PageHeader title="Payments" description="Payment history for your lab bookings, medicine orders, and doctor appointments." />

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
        <LoadingState rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState title="No payments found" description="Try a different filter." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purpose</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.purpose}-${r.id}`}>
                  <TableCell><Badge variant="secondary">{r.purpose}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(r.createdAt)}</TableCell>
                  <TableCell className="text-sm">{r.type}</TableCell>
                  <TableCell className="text-sm font-medium">{formatCurrency(r.amount)}</TableCell>
                  <TableCell><StatusBadge status={r.rawStatus} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
