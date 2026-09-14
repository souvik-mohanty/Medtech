import { Link, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getMyOrders } from "@/services/api/ordersApi"
import { formatCurrency, formatDateTime } from "@/lib/utils"

export function PatientOrdersPage() {
  const navigate = useNavigate()
  const { data: orders, isLoading } = useQuery({ queryKey: ["orders", "mine"], queryFn: getMyOrders })

  return (
    <div>
      <PageHeader
        title="My Orders"
        description="Your medicine and equipment orders."
        actions={
          <Button asChild>
            <Link to="/patient/medicines"><Plus className="size-4" /> Order Medicines</Link>
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState rows={5} />
      ) : !orders || orders.length === 0 ? (
        <EmptyState title="No orders found" description="Your medicine orders will show up here." actionLabel="Order Medicines" onAction={() => navigate("/patient/medicines")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <p className="font-medium">#{o.id}</p>
                    {o.invoiceNumber && <p className="text-xs text-muted-foreground">Invoice {o.invoiceNumber}</p>}
                  </TableCell>
                  <TableCell className="text-sm">{o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(o.createdAt)}</TableCell>
                  <TableCell className="text-sm font-medium">{formatCurrency(o.totalAmount)}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
