import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Banknote, Check, CreditCard, IndianRupee, Landmark, Loader2, Smartphone, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/common/PageHeader"
import { StatCard } from "@/components/common/StatCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getOwnerPayments } from "@/services/api/paymentsApi"
import { markBookingCashPaid } from "@/services/api/bookingsApi"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import type { PaymentStatus } from "@/types"

const METHOD_ICON = { UPI: Smartphone, CARD: CreditCard, NETBANKING: Landmark, WALLET: Wallet, CASH: Banknote } as const

export function OwnerPaymentsPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<PaymentStatus | "ALL">("ALL")
  const { data: payments, isLoading } = useQuery({
    queryKey: ["owner-payments", status],
    queryFn: () => getOwnerPayments(status),
  })

  const markReceivedMutation = useMutation({
    mutationFn: (bookingId: string) => markBookingCashPaid(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-payments"] })
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      toast.success("Cash payment marked received")
    },
  })

  const stats = useMemo(() => {
    const all = payments ?? []
    return {
      collected: all.filter((p) => p.status === "SUCCESS").reduce((sum, p) => sum + p.amount, 0),
      pending: all.filter((p) => p.status === "PENDING").length,
      failed: all.filter((p) => p.status === "FAILED").length,
      refunded: all.filter((p) => p.status === "REFUNDED" || p.status === "PARTIALLY_REFUNDED").length,
    }
  }, [payments])

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Every transaction across your laboratory."
        actions={
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Collected" value={formatCurrency(stats.collected)} icon={IndianRupee} tone="success" />
        <StatCard label="Pending" value={String(stats.pending)} icon={CreditCard} tone="warning" />
        <StatCard label="Failed" value={String(stats.failed)} icon={CreditCard} tone="destructive" />
        <StatCard label="Refunded" value={String(stats.refunded)} icon={CreditCard} />
      </div>

      {isLoading ? (
        <LoadingState rows={6} />
      ) : !payments || payments.length === 0 ? (
        <EmptyState title="No payments found" />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Refund</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => {
                const Icon = METHOD_ICON[p.method]
                const awaitingCash = p.method === "CASH" && p.status === "PENDING"
                const pending = markReceivedMutation.isPending && markReceivedMutation.variables === p.bookingId
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.patientName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">#{p.bookingId}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(p.createdAt)}</TableCell>
                    <TableCell className="text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon className="size-3.5 text-muted-foreground" /> {p.method}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(p.amount)}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.refundStatus && p.refundStatus !== "NONE" ? <StatusBadge status={p.refundStatus} /> : "—"}
                    </TableCell>
                    <TableCell>
                      {awaitingCash && (
                        <Button size="sm" onClick={() => markReceivedMutation.mutate(p.bookingId)} disabled={pending}>
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
