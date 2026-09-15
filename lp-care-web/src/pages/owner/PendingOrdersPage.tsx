import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, IndianRupee, Loader2, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageHeader } from "@/components/common/PageHeader"
import { DashboardSectionCard } from "@/components/layouts/DashboardShell"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getOwnerBookings, markBookingCashPaid, recordPayment } from "@/services/api/bookingsApi"
import { getOwnerOrders, markOrderPaid } from "@/services/api/ordersApi"
import { errorMessage } from "@/lib/apiClient"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import type { Booking, PaymentHistoryEntry } from "@/types"

interface PendingRow {
  kind: "Lab Test" | "Medicine"
  id: string
  who: string
  summary: string
  who2?: string
  isWalkIn: boolean
  totalAmount: number
  amountPaid: number
  paymentHistory: PaymentHistoryEntry[]
  booking?: Booking
}

export function OwnerPendingOrdersPage() {
  const queryClient = useQueryClient()
  const { data: bookings, isLoading: loadingBookings } = useQuery({ queryKey: ["owner-bookings"], queryFn: () => getOwnerBookings() })
  const { data: orders, isLoading: loadingOrders } = useQuery({ queryKey: ["owner-orders"], queryFn: getOwnerOrders })
  const [paymentTarget, setPaymentTarget] = useState<Booking | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")

  const pendingBookings: PendingRow[] = (bookings ?? [])
    .filter((b) => b.paymentStatus === "PENDING" || b.paymentStatus === "PARTIALLY_PAID")
    .map((b) => ({
      kind: "Lab Test",
      id: b.id,
      who: b.forFamilyMemberName ?? b.patientName,
      summary: `#${b.id} · ${b.packageName ?? b.items.map((i) => i.testName).join(", ")} · ${formatDate(b.collectionDate)}`,
      isWalkIn: b.source === "FRANCHISE_COUNTER",
      totalAmount: b.totalAmount,
      amountPaid: b.amountPaid,
      paymentHistory: b.paymentHistory,
      booking: b,
    }))

  const pendingOrders: PendingRow[] = (orders ?? [])
    .filter((o) => o.status === "PAYMENT_PENDING")
    .map((o) => ({
      kind: "Medicine",
      id: o.id,
      who: o.patientName ?? o.customerName ?? o.patientEmail ?? "Walk-in",
      summary: `#${o.id} · ${o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}`,
      isWalkIn: o.source === "FRANCHISE_COUNTER",
      totalAmount: o.totalAmount,
      amountPaid: 0,
      paymentHistory: o.paymentHistory,
    }))

  const pending = [...pendingBookings, ...pendingOrders]
  const isLoading = loadingBookings || loadingOrders

  const markBookingPaidMutation = useMutation({
    mutationFn: (id: string) => markBookingCashPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      toast.success("Marked fully paid")
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const markOrderPaidMutation = useMutation({
    mutationFn: (id: string) => markOrderPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-orders"] })
      toast.success("Marked fully paid")
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const paymentMutation = useMutation({
    mutationFn: () => recordPayment(paymentTarget!.id, Number(paymentAmount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      toast.success("Payment recorded")
      setPaymentTarget(null)
      setPaymentAmount("")
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  return (
    <div>
      <PageHeader title="Pending Online Orders" description="Lab bookings and medicine orders — walk-in or online — still awaiting full payment." />

      {isLoading ? (
        <LoadingState rows={5} />
      ) : pending.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No pending orders" description="Everything has been paid in full." />
      ) : (
        <div className="space-y-3">
          {pending.map((r) => {
            const pendingAmount = r.totalAmount - r.amountPaid
            return (
              <DashboardSectionCard key={`${r.kind}-${r.id}`} className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{r.who}</p>
                    <Badge variant="secondary" className="text-[10px]">{r.kind}</Badge>
                    {r.isWalkIn && <Badge variant="secondary" className="text-[10px]">Walk-in</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{r.summary}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatCurrency(r.amountPaid)} paid · <span className="font-medium text-warning-foreground">Pending {formatCurrency(pendingAmount)}</span>
                  </p>
                  {r.paymentHistory.length > 0 && (
                    <div className="mt-1 space-y-0.5 border-l-2 border-muted pl-2">
                      {r.paymentHistory.map((h, i) => (
                        <p key={i} className="text-[11px] text-muted-foreground">{formatCurrency(h.amount)} on {formatDateTime(h.recordedAt)}</p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{formatCurrency(r.totalAmount)}</span>
                  <StatusBadge status={r.kind === "Lab Test" ? (r.amountPaid > 0 ? "PARTIALLY_PAID" : "PENDING") : "PAYMENT_PENDING"} />
                  {r.kind === "Lab Test" && r.booking && (
                    <Button size="sm" variant="outline" onClick={() => { setPaymentTarget(r.booking!); setPaymentAmount("") }}>
                      <IndianRupee className="size-3.5" /> Record payment
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={
                      r.kind === "Lab Test"
                        ? markBookingPaidMutation.isPending && markBookingPaidMutation.variables === r.id
                        : markOrderPaidMutation.isPending && markOrderPaidMutation.variables === r.id
                    }
                    onClick={() => (r.kind === "Lab Test" ? markBookingPaidMutation.mutate(r.id) : markOrderPaidMutation.mutate(r.id))}
                  >
                    {(r.kind === "Lab Test" ? markBookingPaidMutation.isPending && markBookingPaidMutation.variables === r.id : markOrderPaidMutation.isPending && markOrderPaidMutation.variables === r.id) ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-3.5" />
                    )}
                    Mark fully paid
                  </Button>
                </div>
              </DashboardSectionCard>
            )
          })}
        </div>
      )}

      <Dialog open={!!paymentTarget} onOpenChange={(open) => !open && setPaymentTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
          </DialogHeader>
          {paymentTarget && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                paymentMutation.mutate()
              }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                {formatCurrency(paymentTarget.amountPaid)} of {formatCurrency(paymentTarget.totalAmount)} collected so far.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="po-amount">Amount received now</Label>
                <Input
                  id="po-amount"
                  type="number"
                  min={1}
                  max={paymentTarget.totalAmount - paymentTarget.amountPaid}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPaymentTarget(null)}>Cancel</Button>
                <Button type="submit" disabled={paymentMutation.isPending || !paymentAmount || Number(paymentAmount) <= 0}>
                  {paymentMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  Record payment
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
