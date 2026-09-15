import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CheckCircle2, Loader2, Plus, Stethoscope, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { StatusBadge } from "@/components/common/StatusBadge"
import {
  createDoctorSchedule,
  getOwnerAppointments,
  getOwnerDoctorSchedules,
  markAppointmentCompleted,
  markAppointmentPaid,
  toggleDoctorScheduleActive,
  updateDoctorSchedule,
} from "@/services/api/appointmentsApi"
import { errorMessage } from "@/lib/apiClient"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import type { CreateDoctorScheduleInput, DoctorSchedule, SlotType } from "@/types"

function scheduleLabel(s: { doctorName: string; scheduleDate: string; startTime: string; endTime: string }) {
  return `${s.doctorName} — ${s.scheduleDate} ${formatTime(s.startTime)}–${formatTime(s.endTime)}`
}

const emptyForm: CreateDoctorScheduleInput = {
  doctorName: "",
  doctorSpecialization: "",
  scheduleDate: "",
  startTime: "",
  endTime: "",
  slotType: "LIMITED",
  maxPatients: 10,
  fee: 0,
  bookingOpensAt: undefined,
}

function formatTime(value: string) {
  return value.slice(0, 5)
}

export function OwnerDoctorsPage() {
  const queryClient = useQueryClient()
  const { data: schedules, isLoading: loadingSchedules } = useQuery({ queryKey: ["owner-doctor-schedules"], queryFn: getOwnerDoctorSchedules })
  const { data: appointments, isLoading: loadingAppointments } = useQuery({ queryKey: ["owner-doctor-appointments"], queryFn: getOwnerAppointments })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<DoctorSchedule | null>(null)
  const [form, setForm] = useState<CreateDoctorScheduleInput>(emptyForm)
  const [selectedScheduleId, setSelectedScheduleId] = useState("")

  const scheduleAppointments = (appointments ?? [])
    .filter((a) => a.scheduleId === selectedScheduleId)
    .sort((a, b) => (a.serialNumber ?? Number.MAX_SAFE_INTEGER) - (b.serialNumber ?? Number.MAX_SAFE_INTEGER))

  function openAddSchedule() {
    setEditingSchedule(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditSchedule(schedule: DoctorSchedule) {
    setEditingSchedule(schedule)
    setForm({
      doctorName: schedule.doctorName,
      doctorSpecialization: schedule.doctorSpecialization ?? "",
      scheduleDate: schedule.scheduleDate,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      slotType: schedule.slotType,
      maxPatients: schedule.maxPatients,
      fee: schedule.fee,
      bookingOpensAt: schedule.bookingOpensAt?.slice(0, 16),
    })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => (editingSchedule ? updateDoctorSchedule(editingSchedule.id, form) : createDoctorSchedule(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-doctor-schedules"] })
      toast.success(editingSchedule ? "Schedule updated" : "Schedule added")
      setForm(emptyForm)
      setDialogOpen(false)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const toggleScheduleMutation = useMutation({
    mutationFn: (id: string) => toggleDoctorScheduleActive(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["owner-doctor-schedules"] })
      toast.success(updated.active ? "Booking resumed" : "Booking stopped")
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => markAppointmentPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-doctor-appointments"] })
      toast.success("Appointment marked paid")
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const markCompletedMutation = useMutation({
    mutationFn: (id: string) => markAppointmentCompleted(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-doctor-appointments"] })
      queryClient.invalidateQueries({ queryKey: ["owner-doctor-schedules"] })
      toast.success("Consultation marked done")
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  return (
    <div>
      <PageHeader
        title="Doctor Appointments"
        description="Set up a doctor's visiting windows and track who books them."
        actions={
          <Button onClick={openAddSchedule}>
            <Plus className="size-4" /> Add schedule
          </Button>
        }
      />

      <Tabs defaultValue="schedules">
        <TabsList>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules">
          {loadingSchedules ? (
            <LoadingState rows={5} />
          ) : !schedules || schedules.length === 0 ? (
            <EmptyState icon={Stethoscope} title="No schedules yet" description="Add a doctor's visiting window so patients can book it." actionLabel="Add schedule" onAction={openAddSchedule} />
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Booked</TableHead>
                    <TableHead>Now serving</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Booking opens</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((s) => {
                    const opensInFuture = !!s.bookingOpensAt && new Date(s.bookingOpensAt) > new Date()
                    return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <p className="font-medium">{s.doctorName}</p>
                        {s.doctorSpecialization && <p className="text-xs text-muted-foreground">{s.doctorSpecialization}</p>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.scheduleDate}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatTime(s.startTime)} – {formatTime(s.endTime)}</TableCell>
                      <TableCell className="text-sm">{s.slotType === "LIMITED" ? "Limited slots" : "Call to arrange"}</TableCell>
                      <TableCell className="text-sm">{s.slotType === "LIMITED" ? `${s.bookedCount} / ${s.maxPatients}` : s.bookedCount}</TableCell>
                      <TableCell className="text-sm">#{s.currentServingSerial}</TableCell>
                      <TableCell className="text-sm font-medium">{formatCurrency(s.fee)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.bookingOpensAt ? (
                          <span className={opensInFuture ? "text-warning-foreground" : ""}>{formatDateTime(s.bookingOpensAt)}</span>
                        ) : (
                          "Immediately"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.active ? "secondary" : "outline"} className={s.active ? "text-success" : "text-muted-foreground"}>
                          {s.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditSchedule(s)}>Edit</Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={toggleScheduleMutation.isPending && toggleScheduleMutation.variables === s.id}
                          onClick={() => toggleScheduleMutation.mutate(s.id)}
                        >
                          {s.active ? "Stop booking" : "Resume booking"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="appointments">
          <div className="mb-4 space-y-1.5">
            <Label>Doctor &amp; time</Label>
            <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
              <SelectTrigger className="w-full sm:w-96"><SelectValue placeholder="Select a doctor and time to view its appointment list" /></SelectTrigger>
              <SelectContent>
                {(schedules ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{scheduleLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingAppointments || loadingSchedules ? (
            <LoadingState rows={5} />
          ) : !selectedScheduleId ? (
            <EmptyState icon={UserRound} title="Select a doctor and time" description="Pick a schedule above to see its appointment list, in serial order." />
          ) : scheduleAppointments.length === 0 ? (
            <EmptyState icon={UserRound} title="No appointments yet" description="Bookings against this schedule will show up here." />
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Consultation</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduleAppointments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm font-medium">{a.serialNumber ?? "—"}</TableCell>
                      <TableCell>
                        <p className="font-medium">{a.patientEmail ?? a.customerName ?? "Walk-in"}</p>
                        <p className="text-xs text-muted-foreground">{a.mobileNumber}</p>
                        {a.note && <p className="text-xs text-muted-foreground">Note: {a.note}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.customerName ? "outline" : "secondary"} className={a.customerName ? "text-muted-foreground" : "text-primary"}>
                          {a.customerName ? "Walk-in" : "Online"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{formatCurrency(a.fee)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.paymentMode === "CASH" ? "Cash" : "Online"}</TableCell>
                      <TableCell><StatusBadge status={a.status} /></TableCell>
                      <TableCell>
                        {a.completed ? (
                          <Badge variant="secondary" className="text-success">Done</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        {a.status === "PAYMENT_PENDING" && (
                          <Button
                            size="sm"
                            disabled={markPaidMutation.isPending && markPaidMutation.variables === a.id}
                            onClick={() => markPaidMutation.mutate(a.id)}
                          >
                            {markPaidMutation.isPending && markPaidMutation.variables === a.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="size-3.5" />
                            )}
                            Mark paid
                          </Button>
                        )}
                        {!a.completed && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={markCompletedMutation.isPending && markCompletedMutation.variables === a.id}
                            onClick={() => markCompletedMutation.mutate(a.id)}
                          >
                            {markCompletedMutation.isPending && markCompletedMutation.variables === a.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="size-3.5" />
                            )}
                            Mark done
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSchedule ? "Edit doctor schedule" : "Add doctor schedule"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              saveMutation.mutate()
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ds-name">Doctor name</Label>
                <Input id="ds-name" value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ds-spec">Specialization (optional)</Label>
                <Input id="ds-spec" value={form.doctorSpecialization ?? ""} onChange={(e) => setForm({ ...form, doctorSpecialization: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ds-date">Date</Label>
                <Input id="ds-date" type="date" value={form.scheduleDate} onChange={(e) => setForm({ ...form, scheduleDate: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ds-start">Start time</Label>
                <Input id="ds-start" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ds-end">End time</Label>
                <Input id="ds-end" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Slot type</Label>
                <Select value={form.slotType} onValueChange={(v) => setForm({ ...form, slotType: v as SlotType })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LIMITED">Limited slots</SelectItem>
                    <SelectItem value="REQUEST">Call to arrange (unlimited)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.slotType === "LIMITED" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="ds-max">Max patients</Label>
                  <Input
                    id="ds-max"
                    type="number"
                    min={1}
                    value={form.maxPatients ?? ""}
                    onChange={(e) => setForm({ ...form, maxPatients: Number(e.target.value) })}
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="ds-fee-alt">Fee (₹)</Label>
                  <Input
                    id="ds-fee-alt"
                    type="number"
                    min={0}
                    value={form.fee}
                    onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })}
                    required
                  />
                </div>
              )}
            </div>

            {form.slotType === "LIMITED" && (
              <div className="space-y-1.5">
                <Label htmlFor="ds-fee">Fee (₹)</Label>
                <Input
                  id="ds-fee"
                  type="number"
                  min={0}
                  value={form.fee}
                  onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })}
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ds-opens">Booking opens at (optional)</Label>
              <Input
                id="ds-opens"
                type="datetime-local"
                value={form.bookingOpensAt ?? ""}
                onChange={(e) => setForm({ ...form, bookingOpensAt: e.target.value || undefined })}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to let patients book immediately. Otherwise online booking stays closed until this moment (you can still enter walk-ins any time).
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {editingSchedule ? "Save changes" : "Add schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
