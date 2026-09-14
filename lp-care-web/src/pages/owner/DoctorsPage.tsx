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
  markAppointmentPaid,
} from "@/services/api/appointmentsApi"
import { errorMessage } from "@/lib/apiClient"
import { formatCurrency } from "@/lib/utils"
import type { CreateDoctorScheduleInput, SlotType } from "@/types"

const emptyForm: CreateDoctorScheduleInput = {
  doctorName: "",
  doctorSpecialization: "",
  scheduleDate: "",
  startTime: "",
  endTime: "",
  slotType: "LIMITED",
  maxPatients: 10,
  fee: 0,
}

function formatTime(value: string) {
  return value.slice(0, 5)
}

export function OwnerDoctorsPage() {
  const queryClient = useQueryClient()
  const { data: schedules, isLoading: loadingSchedules } = useQuery({ queryKey: ["owner-doctor-schedules"], queryFn: getOwnerDoctorSchedules })
  const { data: appointments, isLoading: loadingAppointments } = useQuery({ queryKey: ["owner-doctor-appointments"], queryFn: getOwnerAppointments })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<CreateDoctorScheduleInput>(emptyForm)

  const createMutation = useMutation({
    mutationFn: () => createDoctorSchedule(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-doctor-schedules"] })
      toast.success("Schedule added")
      setForm(emptyForm)
      setDialogOpen(false)
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

  return (
    <div>
      <PageHeader
        title="Doctor Appointments"
        description="Set up a doctor's visiting windows and track who books them."
        actions={
          <Button onClick={() => { setForm(emptyForm); setDialogOpen(true) }}>
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
            <EmptyState icon={Stethoscope} title="No schedules yet" description="Add a doctor's visiting window so patients can book it." actionLabel="Add schedule" onAction={() => setDialogOpen(true)} />
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
                    <TableHead>Fee</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <p className="font-medium">{s.doctorName}</p>
                        {s.doctorSpecialization && <p className="text-xs text-muted-foreground">{s.doctorSpecialization}</p>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.scheduleDate}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatTime(s.startTime)} – {formatTime(s.endTime)}</TableCell>
                      <TableCell className="text-sm">{s.slotType === "LIMITED" ? "Limited slots" : "Call to arrange"}</TableCell>
                      <TableCell className="text-sm">{s.slotType === "LIMITED" ? `${s.bookedCount} / ${s.maxPatients}` : s.bookedCount}</TableCell>
                      <TableCell className="text-sm font-medium">{formatCurrency(s.fee)}</TableCell>
                      <TableCell>
                        <Badge variant={s.active ? "secondary" : "outline"} className={s.active ? "text-success" : "text-muted-foreground"}>
                          {s.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="appointments">
          {loadingAppointments ? (
            <LoadingState rows={5} />
          ) : !appointments || appointments.length === 0 ? (
            <EmptyState icon={UserRound} title="No appointments yet" description="Bookings against your schedules will show up here." />
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <p className="font-medium">{a.patientEmail}</p>
                        <p className="text-xs text-muted-foreground">{a.mobileNumber}</p>
                        {a.note && <p className="text-xs text-muted-foreground">Note: {a.note}</p>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.doctorName}
                        {a.doctorSpecialization && <p className="text-xs text-muted-foreground">{a.doctorSpecialization}</p>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.scheduleDate} · {formatTime(a.startTime)}–{formatTime(a.endTime)}
                      </TableCell>
                      <TableCell className="text-sm">{a.serialNumber ?? "—"}</TableCell>
                      <TableCell className="text-sm font-medium">{formatCurrency(a.fee)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.paymentMode === "CASH" ? "Cash" : "Online"}</TableCell>
                      <TableCell><StatusBadge status={a.status} /></TableCell>
                      <TableCell className="text-right">
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
            <DialogTitle>Add doctor schedule</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate()
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Add schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
