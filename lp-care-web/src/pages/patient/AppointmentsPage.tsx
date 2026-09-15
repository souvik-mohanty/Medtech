import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { CheckCircle2, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { DashboardSectionCard } from "@/components/layouts/DashboardShell"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { StatusBadge } from "@/components/common/StatusBadge"
import { getMyAppointments } from "@/services/api/appointmentsApi"
import { formatCurrency } from "@/lib/utils"

function formatTime(value: string) {
  return value.slice(0, 5)
}

export function PatientAppointmentsPage() {
  const { data: appointments, isLoading } = useQuery({ queryKey: ["appointments", "mine"], queryFn: getMyAppointments })

  return (
    <div>
      <PageHeader
        title="My Appointments"
        description="Doctor appointments you've booked."
        actions={
          <Button asChild>
            <Link to="/patient/book-doctor">Book a doctor</Link>
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState rows={4} />
      ) : !appointments || appointments.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No appointments yet" description="Book a doctor's visiting window to see it here." actionLabel="Book a doctor" onAction={() => (window.location.href = "/patient/book-doctor")} />
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <DashboardSectionCard key={a.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Stethoscope className="size-5" />
                </div>
                <div>
                  <p className="font-medium">{a.doctorName}</p>
                  {a.doctorSpecialization && <p className="text-xs text-muted-foreground">{a.doctorSpecialization}</p>}
                  <p className="text-xs text-muted-foreground">
                    {a.scheduleDate} · {formatTime(a.startTime)}–{formatTime(a.endTime)}
                    {a.serialNumber !== undefined && ` · Serial #${a.serialNumber}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{formatCurrency(a.fee)}</span>
                {a.completed ? (
                  <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                    <CheckCircle2 className="size-3.5" /> Consultation done
                  </span>
                ) : (
                  <StatusBadge status={a.status} />
                )}
              </div>
            </DashboardSectionCard>
          ))}
        </div>
      )}
    </div>
  )
}
