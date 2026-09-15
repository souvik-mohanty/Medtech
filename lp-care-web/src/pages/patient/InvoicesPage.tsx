import { useMemo } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Download, Loader2, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/common/PageHeader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getMyBookings, viewMyBookingInvoice } from "@/services/api/bookingsApi"
import { getMyOrders, viewMyOrderInvoice } from "@/services/api/ordersApi"
import { errorMessage } from "@/lib/apiClient"
import { formatCurrency, formatDateTime } from "@/lib/utils"

interface InvoiceRow {
  id: string
  kind: "Lab Booking" | "Medicine Order"
  summary: string
  amount: number
  createdAt: string
  canView: boolean
  viewFn: () => Promise<void>
}

export function InvoicesPage() {
  const { data: bookings, isLoading: loadingBookings } = useQuery({ queryKey: ["bookings", "mine"], queryFn: getMyBookings })
  const { data: orders, isLoading: loadingOrders } = useQuery({ queryKey: ["orders", "mine"], queryFn: getMyOrders })

  const viewMutation = useMutation({
    mutationFn: (fn: () => Promise<void>) => fn(),
    onError: (err) => toast.error(errorMessage(err)),
  })

  const rows = useMemo<InvoiceRow[]>(() => {
    const bookingRows: InvoiceRow[] = (bookings ?? []).map((b) => ({
      id: b.id,
      kind: "Lab Booking",
      summary: b.packageName ?? b.items.map((i) => i.testName).join(", "),
      amount: b.totalAmount,
      createdAt: b.createdAt,
      canView: b.paymentStatus !== "PENDING",
      viewFn: () => viewMyBookingInvoice(b.id),
    }))
    const orderRows: InvoiceRow[] = (orders ?? []).map((o) => ({
      id: o.id,
      kind: "Medicine Order",
      summary: o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", "),
      amount: o.totalAmount,
      createdAt: o.createdAt,
      canView: !!o.invoiceNumber,
      viewFn: () => viewMyOrderInvoice(o.id),
    }))
    return [...bookingRows, ...orderRows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [bookings, orders])

  const isLoading = loadingBookings || loadingOrders

  return (
    <div>
      <PageHeader title="Invoices" description="Invoices for every lab booking and medicine order you've paid for." />

      {isLoading ? (
        <LoadingState rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices yet" description="Invoices show up here once you've booked a test or placed an order." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.kind}-${r.id}`}>
                  <TableCell><Badge variant="secondary">{r.kind}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.summary}</TableCell>
                  <TableCell className="text-sm">{formatDateTime(r.createdAt)}</TableCell>
                  <TableCell className="text-sm font-medium">{formatCurrency(r.amount)}</TableCell>
                  <TableCell>
                    {r.canView ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={viewMutation.isPending && viewMutation.variables === r.viewFn}
                        onClick={() => viewMutation.mutate(r.viewFn)}
                      >
                        {viewMutation.isPending && viewMutation.variables === r.viewFn ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Download className="size-3.5" />
                        )}
                        PDF
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Awaiting payment</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
