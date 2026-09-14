import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Banknote, Loader2, Smartphone, Stethoscope, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageHeader } from "@/components/common/PageHeader"
import { DashboardSectionCard } from "@/components/layouts/DashboardShell"
import { EmptyState } from "@/components/common/EmptyState"
import { CardGridSkeleton } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { bookAppointment, getDoctorSchedules } from "@/services/api/appointmentsApi"
import { getPaymentGatewayConfig } from "@/services/api/paymentGatewayApi"
import { errorMessage } from "@/lib/apiClient"
import { cn, formatCurrency } from "@/lib/utils"
import type { DoctorSchedule } from "@/types"

function formatTime(value: string) {
  return value.slice(0, 5)
}

export function BookDoctorPage() {
  const navigate = useNavigate()
  const { data: schedules, isLoading, isError, refetch } = useQuery({ queryKey: ["doctor-schedules"], queryFn: getDoctorSchedules })
  const { data: gatewayConfig } = useQuery({ queryKey: ["payment-gateway"], queryFn: getPaymentGatewayConfig })
  const hasGateway = !!gatewayConfig?.active

  const [target, setTarget] = useState<DoctorSchedule | null>(null)
  const [mobileNumber, setMobileNumber] = useState("")
  const [note, setNote] = useState("")
  const [paymentMode, setPaymentMode] = useState<"CASH" | "ONLINE">("CASH")

  function openBooking(schedule: DoctorSchedule) {
    setTarget(schedule)
    setMobileNumber("")
    setNote("")
    setPaymentMode(hasGateway ? "ONLINE" : "CASH")
  }

  const bookMutation = useMutation({
    mutationFn: () =>
      bookAppointment({
        scheduleId: target!.id,
        mobileNumber,
        note: note || undefined,
        paymentMode: hasGateway ? paymentMode : "CASH",
      }),
    onSuccess: () => {
      toast.success("Appointment booked")
      setTarget(null)
      navigate("/patient/appointments")
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  return (
    <div>
      <PageHeader title="Book a Doctor" description="Upcoming visiting windows at this lab." />

      {isLoading ? (
        <CardGridSkeleton count={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !schedules || schedules.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No upcoming schedules" description="Check back later for doctor visiting windows." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schedules.map((s) => {
            const full = s.slotType === "LIMITED" && s.maxPatients !== undefined && s.bookedCount >= s.maxPatients
            return (
              <DashboardSectionCard key={s.id} className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Stethoscope className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{s.doctorName}</p>
                    {s.doctorSpecialization && <p className="text-xs text-muted-foreground">{s.doctorSpecialization}</p>}
                  </div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{s.scheduleDate} · {formatTime(s.startTime)} – {formatTime(s.endTime)}</p>
                  <p className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {s.slotType === "LIMITED" ? `${s.bookedCount} / ${s.maxPatients} booked` : "Call to arrange — no slot limit"}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-lg font-bold">{formatCurrency(s.fee)}</span>
                  <Button size="sm" disabled={full} onClick={() => openBooking(s)}>
                    {full ? "Fully booked" : "Book"}
                  </Button>
                </div>
              </DashboardSectionCard>
            )
          })}
        </div>
      )}

      <Dialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book appointment{target ? ` — ${target.doctorName}` : ""}</DialogTitle>
          </DialogHeader>
          {target && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                bookMutation.mutate()
              }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                {target.scheduleDate} · {formatTime(target.startTime)}–{formatTime(target.endTime)} · {formatCurrency(target.fee)}
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="ap-mobile">Mobile number</Label>
                <Input id="ap-mobile" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ap-note">Note (optional)</Label>
                <Textarea id="ap-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything the doctor should know beforehand" />
              </div>

              <div className="space-y-1.5">
                <Label>Payment</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!hasGateway}
                    onClick={() => setPaymentMode("ONLINE")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg border p-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      hasGateway && paymentMode === "ONLINE" ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/50",
                    )}
                  >
                    <Smartphone className="size-4" /> Pay online
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("CASH")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg border p-2.5 text-sm transition-colors",
                      !hasGateway || paymentMode === "CASH" ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/50",
                    )}
                  >
                    <Banknote className="size-4" /> Pay at visit
                  </button>
                </div>
                {!hasGateway && <p className="text-xs text-muted-foreground">Online payment isn't set up yet — pay at the visit instead.</p>}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setTarget(null)}>Cancel</Button>
                <Button type="submit" disabled={bookMutation.isPending || !mobileNumber.trim()}>
                  {bookMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  {hasGateway && paymentMode === "ONLINE" ? `Pay ${formatCurrency(target.fee)}` : "Confirm booking"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
