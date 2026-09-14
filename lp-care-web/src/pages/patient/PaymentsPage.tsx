import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Banknote, CreditCard, Landmark, Smartphone, Wallet } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getMyPayments } from "@/services/api/paymentsApi"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import type { PaymentStatus } from "@/types"

const METHOD_ICON = { UPI: Smartphone, CARD: CreditCard, NETBANKING: Landmark, WALLET: Wallet, CASH: Banknote } as const

export function PatientPaymentsPage() {
  const [status, setStatus] = useState<PaymentStatus | "ALL">("ALL")
  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments", "mine", status],
    queryFn: () => getMyPayments(status),
  })

  const mine = payments ?? []

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Payment history and receipts for all your bookings."
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

      {isLoading ? (
        <LoadingState rows={5} />
      ) : mine.length === 0 ? (
        <EmptyState title="No payments found" description="Your payment history will show up here." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Refund</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mine.map((p) => {
                const Icon = METHOD_ICON[p.method]
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">#{p.bookingId}</TableCell>
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
