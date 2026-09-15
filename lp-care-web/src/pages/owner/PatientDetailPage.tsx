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
import { getOwnerOrders } from "@/services/api/ordersApi"
import { getOwnerAppointments } from "@/services/api/appointmentsApi"
import { formatCurrency, formatDate } from "@/lib/utils"

export function OwnerPatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>()

  const { data: patients, isLoading: loadingPatient } = useQuery({ queryKey: ["owner-patients"], queryFn: () => getPatientSummaries() })
  const { data: allBookings, isLoading: loadingBookings } = useQuery({ queryKey: ["owner-bookings"], queryFn: () => getOwnerBookings() })
  const { data: allOrders, isLoading: loadingOrders } = useQuery({ queryKey: ["owner-orders"], queryFn: getOwnerOrders })
  const { data: allAppointments, isLoading: loadingAppointments } = useQuery({ queryKey: ["owner-doctor-appointments"], queryFn: getOwnerAppointments })

  const patient = patients?.find((p) => p.id === patientId)

  // A patient with an email has a real account — match records by that account's
  // identity, same as before. A walk-in (Express Billing) customer has no account
  // to match by, so records are matched by the same name+phone combo the owner
  // directory itself grouped them by — see PatientDirectoryService#groupFor.
  const bookings = (allBookings ?? []).filter((b) =>
    patient?.email ? b.patientId === patient.id : !b.patientId && b.patientName === patient?.fullName && (!patient?.phone || b.phone === patient.phone)
  )
  const orders = (allOrders ?? []).filter((o) =>
    patient?.email ? o.patientEmail === patient.email : !o.patientEmail && o.customerName === patient?.fullName && (!patient?.phone || o.customerPhone === patient.phone)
  )
  const appointments = (allAppointments ?? []).filter((a) =>
    patient?.email ? a.patientEmail === patient.email : !a.patientEmail && a.customerName === patient?.fullName
  )

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
      <PageHeader title={patient.fullName} description="Purchase and appointment history, and contact details." />

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
              <p className="text-muted-foreground">Bookings</p>
              <p className="font-semibold">{patient.totalBookings}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Orders</p>
              <p className="font-semibold">{patient.totalOrders}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Appointments</p>
              <p className="font-semibold">{patient.totalAppointments}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last activity</p>
              <p className="font-semibold">{patient.lastActivityDate ? formatDate(patient.lastActivityDate) : "—"}</p>
            </div>
          </div>
        </DashboardSectionCard>

        <div className="space-y-5">
          <DashboardSectionCard>
            <h2 className="mb-4 font-semibold">Lab booking history</h2>
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

          <DashboardSectionCard>
            <h2 className="mb-4 font-semibold">Medicine order history</h2>
            {loadingOrders ? (
              <LoadingState rows={3} />
            ) : orders.length === 0 ? (
              <EmptyState title="No orders yet" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Items</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}</TableCell>
                        <TableCell className="text-sm">{formatDate(o.createdAt)}</TableCell>
                        <TableCell className="text-sm">{formatCurrency(o.totalAmount)}</TableCell>
                        <TableCell><StatusBadge status={o.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DashboardSectionCard>

          <DashboardSectionCard>
            <h2 className="mb-4 font-semibold">Doctor appointment history</h2>
            {loadingAppointments ? (
              <LoadingState rows={3} />
            ) : appointments.length === 0 ? (
              <EmptyState title="No appointments yet" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Consultation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.doctorName}</TableCell>
                        <TableCell className="text-sm">{formatDate(a.scheduleDate)}</TableCell>
                        <TableCell className="text-sm">{formatCurrency(a.fee)}</TableCell>
                        <TableCell><StatusBadge status={a.status} /></TableCell>
                        <TableCell>
                          {a.completed ? <StatusBadge status="COMPLETED" /> : <StatusBadge status="PENDING" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DashboardSectionCard>
        </div>
      </div>
    </div>
  )
}
