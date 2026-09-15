import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CheckCircle2, Eye, Loader2, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getOwnerOrders, markOrderPaid, viewOwnerInvoice } from "@/services/api/ordersApi"
import { errorMessage } from "@/lib/apiClient"
import { formatCurrency, formatDateTime } from "@/lib/utils"

export function OwnerOrdersPage() {
  const queryClient = useQueryClient()
  const { data: orders, isLoading } = useQuery({ queryKey: ["owner-orders"], queryFn: getOwnerOrders })

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => markOrderPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-orders"] })
      toast.success("Order marked paid — invoice generated and stock updated")
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const invoiceMutation = useMutation({
    mutationFn: (id: string) => viewOwnerInvoice(id),
    onError: (err) => toast.error(errorMessage(err)),
  })

  return (
    <div>
      <PageHeader title="Medicine Orders" description="Orders placed by patients for medicines and equipment." />

      {isLoading ? (
        <LoadingState rows={6} />
      ) : !orders || orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders yet" />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <p className="font-medium">#{o.id}</p>
                    {o.invoiceNumber && <p className="text-xs text-muted-foreground">Invoice {o.invoiceNumber}</p>}
                  </TableCell>
                  <TableCell className="text-sm">
                    <p className="font-medium text-foreground">
                      {o.patientName ?? o.customerName ?? o.patientEmail}
                      {o.source === "FRANCHISE_COUNTER" && <Badge variant="secondary" className="ml-2 text-[10px]">Counter</Badge>}
                    </p>
                    {(o.mobileNumber ?? o.customerPhone) && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{o.mobileNumber ?? o.customerPhone}</p>
                    )}
                    {o.addressLine1 && (
                      <p className="mt-0.5 max-w-xs text-xs text-muted-foreground">
                        {o.addressLabel ? `${o.addressLabel}: ` : ""}
                        {o.addressLine1}{o.addressLine2 ? `, ${o.addressLine2}` : ""}, {o.addressCity}, {o.addressState} – {o.addressPincode}
                      </p>
                    )}
                    {o.referralName && <p className="mt-0.5 text-xs text-muted-foreground">Ref: {o.referralName}</p>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(o.createdAt)}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatCurrency(o.totalAmount)}
                    {o.status === "PAYMENT_PENDING" && <p className="mt-0.5 text-xs font-normal text-warning-foreground">Pending {formatCurrency(o.totalAmount)}</p>}
                    {o.paymentHistory.length > 0 && (
                      <div className="mt-1 space-y-0.5 border-l-2 border-muted pl-2 font-normal">
                        {o.paymentHistory.map((h, i) => (
                          <p key={i} className="text-[11px] text-muted-foreground">{formatCurrency(h.amount)} on {formatDateTime(h.recordedAt)}</p>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell className="flex justify-end gap-2">
                    {o.status === "PAYMENT_PENDING" && (
                      <Button
                        size="sm"
                        disabled={markPaidMutation.isPending && markPaidMutation.variables === o.id}
                        onClick={() => markPaidMutation.mutate(o.id)}
                      >
                        {markPaidMutation.isPending && markPaidMutation.variables === o.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        Mark paid
                      </Button>
                    )}
                    {o.invoiceNumber && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={invoiceMutation.isPending && invoiceMutation.variables === o.id}
                        onClick={() => invoiceMutation.mutate(o.id)}
                      >
                        {invoiceMutation.isPending && invoiceMutation.variables === o.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                        Invoice
                      </Button>
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
