import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Mail, Phone } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { DashboardSectionCard } from "@/components/layouts/DashboardShell"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getPatientSummaries } from "@/services/api/patientsApi"
import { getOwnerBookings } from "@/services/api/bookingsApi"
import { formatCurrency, formatDate } from "@/lib/utils"

export function OwnerPatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>()

  const { data: patients, isLoading: loadingPatient } = useQuery({ queryKey: ["owner-patients"], queryFn: () => getPatientSummaries() })
  const { data: bookings, isLoading: loadingBookings } = useQuery({
    queryKey: ["bookings", patientId],
    queryFn: () => getOwnerBookings({ patientId }),
    enabled: !!patientId,
  })

  const patient = patients?.find((p) => p.id === patientId)

  if (loadingPatient) {
    return (
      <div>
        <PageHeader title="Patient" />
        <LoadingState rows={4} />
      </div>
    )
  }

  if (!patient) {
    return (
      <div>
        <PageHeader title="Patient" />
        <EmptyState title="Patient not found" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={patient.fullName} description="Booking history and contact details." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
        <DashboardSectionCard className="h-fit">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="size-4 text-primary" /> {patient.phone}
          </div>
          {patient.email && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Mail className="size-4 text-primary" /> {patient.email}
            </div>
          )}
          <div className="mt-4 flex items-center gap-2">
            <StatusBadge status={patient.status} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Total bookings</p>
              <p className="font-semibold">{patient.totalBookings}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last booking</p>
              <p className="font-semibold">{patient.lastBookingDate ? formatDate(patient.lastBookingDate) : "—"}</p>
            </div>
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Booking history</h2>
          {loadingBookings ? (
            <LoadingState rows={3} />
          ) : !bookings || bookings.length === 0 ? (
            <EmptyState title="No bookings yet" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.packageName ?? b.items.map((i) => i.testName).join(", ")}</TableCell>
                      <TableCell className="text-sm">{formatDate(b.createdAt)}</TableCell>
                      <TableCell className="text-sm">{formatCurrency(b.totalAmount)}</TableCell>
                      <TableCell><StatusBadge status={b.paymentStatus} /></TableCell>
                      <TableCell><StatusBadge status={b.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DashboardSectionCard>
      </div>
    </div>
  )
}
