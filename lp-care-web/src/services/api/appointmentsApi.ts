import { apiClient } from "@/lib/apiClient"
import { getFranchiseId } from "@/services/api/franchiseApi"
import type { AppointmentStatus, BookAppointmentInput, CreateDoctorScheduleInput, DoctorAppointment, DoctorSchedule, SlotType } from "@/types"

interface BackendDoctorSchedule {
  id: string
  doctorName: string
  doctorSpecialization: string | null
  scheduleDate: string
  startTime: string
  endTime: string
  slotType: SlotType
  maxPatients: number | null
  bookedCount: number
  fee: number
  active: boolean
}

function toDoctorSchedule(s: BackendDoctorSchedule): DoctorSchedule {
  return {
    id: s.id,
    doctorName: s.doctorName,
    doctorSpecialization: s.doctorSpecialization ?? undefined,
    scheduleDate: s.scheduleDate,
    startTime: s.startTime,
    endTime: s.endTime,
    slotType: s.slotType,
    maxPatients: s.maxPatients ?? undefined,
    bookedCount: s.bookedCount,
    fee: s.fee,
    active: s.active,
  }
}

interface BackendDoctorAppointment {
  id: string
  patientEmail: string
  doctorName: string
  doctorSpecialization: string | null
  scheduleDate: string
  startTime: string
  endTime: string
  slotType: SlotType
  serialNumber: number | null
  mobileNumber: string
  note: string | null
  fee: number
  paymentMode: "CASH" | "ONLINE"
  status: AppointmentStatus
  createdAt: string
  paidAt: string | null
}

function toDoctorAppointment(a: BackendDoctorAppointment): DoctorAppointment {
  return {
    id: a.id,
    patientEmail: a.patientEmail,
    doctorName: a.doctorName,
    doctorSpecialization: a.doctorSpecialization ?? undefined,
    scheduleDate: a.scheduleDate,
    startTime: a.startTime,
    endTime: a.endTime,
    slotType: a.slotType,
    serialNumber: a.serialNumber ?? undefined,
    mobileNumber: a.mobileNumber,
    note: a.note ?? undefined,
    fee: a.fee,
    paymentMode: a.paymentMode,
    status: a.status,
    createdAt: a.createdAt,
    paidAt: a.paidAt ?? undefined,
  }
}

// ---- Patient-facing ----

/** Only active, upcoming schedules for the one franchise this deployment serves. */
export async function getDoctorSchedules(): Promise<DoctorSchedule[]> {
  const franchiseId = await getFranchiseId()
  const response = await apiClient.get<{ data: BackendDoctorSchedule[] }>(`/api/patient/franchises/${franchiseId}/doctors/schedules`)
  return response.data.data.map(toDoctorSchedule)
}

export async function getMyAppointments(): Promise<DoctorAppointment[]> {
  const response = await apiClient.get<{ data: BackendDoctorAppointment[] }>("/api/patient/doctors/appointments")
  return response.data.data.map(toDoctorAppointment)
}

export async function bookAppointment(input: BookAppointmentInput): Promise<DoctorAppointment> {
  const response = await apiClient.post<{ data: BackendDoctorAppointment }>("/api/patient/doctors/appointments", input)
  return toDoctorAppointment(response.data.data)
}

// ---- Owner-facing ----

export async function getOwnerDoctorSchedules(): Promise<DoctorSchedule[]> {
  const response = await apiClient.get<{ data: BackendDoctorSchedule[] }>("/api/franchise/doctors/schedules")
  return response.data.data.map(toDoctorSchedule)
}

export async function createDoctorSchedule(input: CreateDoctorScheduleInput): Promise<DoctorSchedule> {
  const response = await apiClient.post<{ data: BackendDoctorSchedule }>("/api/franchise/doctors/schedules", input)
  return toDoctorSchedule(response.data.data)
}

export async function getOwnerAppointments(): Promise<DoctorAppointment[]> {
  const response = await apiClient.get<{ data: BackendDoctorAppointment[] }>("/api/franchise/doctors/appointments")
  return response.data.data.map(toDoctorAppointment)
}

/** Owner action — confirms a CASH appointment's fee was collected at the visit. */
export async function markAppointmentPaid(id: string): Promise<DoctorAppointment> {
  const response = await apiClient.patch<{ data: BackendDoctorAppointment }>(`/api/franchise/doctors/appointments/${id}/mark-paid`)
  return toDoctorAppointment(response.data.data)
}
