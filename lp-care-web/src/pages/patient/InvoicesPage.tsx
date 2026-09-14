import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Download, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getInvoices } from "@/services/api/invoicesApi"
import { formatCurrency, formatDate } from "@/lib/utils"

export function InvoicesPage() {
  const { data: invoices, isLoading } = useQuery({ queryKey: ["invoices", "Ananya Sharma"], queryFn: () => getInvoices("Ananya Sharma") })

  return (
    <div>
      <PageHeader title="Invoices" description="GST-compliant invoices generated after every successful payment." />

      {isLoading ? (
        <LoadingState rows={4} />
      ) : !invoices || invoices.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices yet" description="Invoices are generated automatically after a successful payment." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">#{inv.bookingId}</TableCell>
                  <TableCell className="text-sm">{formatDate(inv.issuedAt)}</TableCell>
                  <TableCell className="text-sm">{inv.discount > 0 ? `-${formatCurrency(inv.discount)}` : "—"}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(inv.gst)}</TableCell>
                  <TableCell className="text-sm font-medium">{formatCurrency(inv.totalAmount)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => toast.info("This is a demo — no real invoice PDF is generated.")}>
                      <Download className="size-3.5" /> PDF
                    </Button>
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
