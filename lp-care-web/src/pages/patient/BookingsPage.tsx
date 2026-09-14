import { Link, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getMyBookings } from "@/services/api/bookingsApi"
import { formatCurrency, formatDate } from "@/lib/utils"

export function PatientBookingsPage() {
  const navigate = useNavigate()
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings", "mine"],
    queryFn: getMyBookings,
  })

  return (
    <div>
      <PageHeader
        title="My Bookings"
        description="All your pathology test and package bookings."
        actions={
          <Button asChild>
            <Link to="/patient/book"><Plus className="size-4" /> Book a Test</Link>
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState rows={5} />
      ) : !bookings || bookings.length === 0 ? (
        <EmptyState title="No bookings found" description="Your test bookings will show up here." actionLabel="Book a Test" onAction={() => navigate("/patient/book")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>For</TableHead>
                <TableHead>Collection</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <p className="font-medium">{b.packageName ?? b.items.map((i) => i.testName).join(", ")}</p>
                    <p className="text-xs text-muted-foreground">#{b.id}</p>
                  </TableCell>
                  <TableCell className="text-sm">{b.forFamilyMemberName ?? "Self"}</TableCell>
                  <TableCell className="text-sm">{b.collectionMethod === "HOME_COLLECTION" ? "Home" : "Lab visit"}</TableCell>
                  <TableCell className="text-sm">{formatDate(b.collectionDate)}</TableCell>
                  <TableCell className="text-sm font-medium">{formatCurrency(b.totalAmount)}</TableCell>
                  <TableCell><StatusBadge status={b.paymentStatus} /></TableCell>
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
