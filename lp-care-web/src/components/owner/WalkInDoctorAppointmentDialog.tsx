import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { bookWalkInAppointment, getOwnerDoctorSchedules } from "@/services/api/appointmentsApi"
import { errorMessage } from "@/lib/apiClient"
import { formatCurrency, nowForDateTimeInput } from "@/lib/utils"

interface WalkInDoctorAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatTime(value: string) {
  return value.slice(0, 5)
}

export function WalkInDoctorAppointmentDialog({ open, onOpenChange }: WalkInDoctorAppointmentDialogProps) {
  const queryClient = useQueryClient()
  const { data: schedules } = useQuery({ queryKey: ["owner-doctor-schedules"], queryFn: getOwnerDoctorSchedules, enabled: open })

  const [scheduleId, setScheduleId] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [patientEmail, setPatientEmail] = useState("")
  const [note, setNote] = useState("")
  const [paidNow, setPaidNow] = useState(true)
  const [entryDateTime, setEntryDateTime] = useState(nowForDateTimeInput())

  const activeSchedules = (schedules ?? []).filter((s) => s.active && (s.slotType !== "LIMITED" || s.maxPatients === undefined || s.bookedCount < s.maxPatients))
  const selectedSchedule = activeSchedules.find((s) => s.id === scheduleId)

  function reset() {
    setScheduleId("")
    setCustomerName("")
    setMobileNumber("")
    setPatientEmail("")
    setNote("")
    setPaidNow(true)
    setEntryDateTime(nowForDateTimeInput())
  }

  const mutation = useMutation({
    mutationFn: () =>
      bookWalkInAppointment({
        scheduleId,
        customerName,
        mobileNumber,
        patientEmail: patientEmail || undefined,
        note: note || undefined,
        paidNow,
        createdAt: entryDateTime || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-doctor-schedules"] })
      queryClient.invalidateQueries({ queryKey: ["owner-doctor-appointments"] })
      toast.success("Appointment booked")
      reset()
      onOpenChange(false)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const canSubmit = scheduleId.length > 0 && customerName.trim().length > 0 && mobileNumber.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); onOpenChange(next) }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Walk-in doctor appointment</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label>Doctor schedule</Label>
            <Select value={scheduleId} onValueChange={setScheduleId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select a schedule" /></SelectTrigger>
              <SelectContent>
                {activeSchedules.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground">No open schedules — add one first.</div>
                )}
                {activeSchedules.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.doctorName} — {s.scheduleDate} {formatTime(s.startTime)}-{formatTime(s.endTime)} ({formatCurrency(s.fee)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSchedule?.slotType === "LIMITED" && (
              <p className="text-xs text-muted-foreground">
                {selectedSchedule.bookedCount} / {selectedSchedule.maxPatients} booked — next serial #{selectedSchedule.bookedCount + 1}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="wa-name">Patient name</Label>
              <Input id="wa-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wa-phone">Mobile number</Label>
              <Input id="wa-phone" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wa-email">Email (optional)</Label>
            <Input
              id="wa-email"
              type="email"
              placeholder="patient@example.com"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              If given, this appointment will show up once the patient logs in with this email.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wa-datetime">Entry date &amp; time</Label>
            <Input id="wa-datetime" type="datetime-local" value={entryDateTime} onChange={(e) => setEntryDateTime(e.target.value)} required />
            <p className="text-xs text-muted-foreground">Defaults to now — change it if you're entering this walk-in after the fact.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wa-note">Note (optional)</Label>
            <Textarea id="wa-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything the doctor should know beforehand" />
          </div>

          <div className="space-y-1.5">
            <Label>Payment</Label>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={paidNow ? "default" : "outline"} onClick={() => setPaidNow(true)}>
                Fully paid
              </Button>
              <Button type="button" size="sm" variant={!paidNow ? "default" : "outline"} onClick={() => setPaidNow(false)}>
                Payment pending
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">Always paid in cash at the counter.</p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit || mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Book appointment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
