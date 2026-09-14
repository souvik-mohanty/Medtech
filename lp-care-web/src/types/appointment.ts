export type SlotType = "LIMITED" | "REQUEST"

export type AppointmentStatus = "CREATED" | "PAYMENT_PENDING" | "PAID" | "CONFIRMED" | "DISPATCHED" | "DELIVERED" | "CANCELLED"

export interface DoctorSchedule {
  id: string
  doctorName: string
  doctorSpecialization?: string
  scheduleDate: string
  startTime: string
  endTime: string
  slotType: SlotType
  /** Only meaningful for LIMITED — undefined for REQUEST. */
  maxPatients?: number
  bookedCount: number
  fee: number
  active: boolean
}

export type CreateDoctorScheduleInput = Omit<DoctorSchedule, "id" | "bookedCount" | "active">

export interface DoctorAppointment {
  id: string
  patientEmail: string
  doctorName: string
  doctorSpecialization?: string
  scheduleDate: string
  startTime: string
  endTime: string
  slotType: SlotType
  /** Only set for LIMITED schedules. */
  serialNumber?: number
  mobileNumber: string
  note?: string
  fee: number
  paymentMode: "CASH" | "ONLINE"
  status: AppointmentStatus
  createdAt: string
  paidAt?: string
}

export interface BookAppointmentInput {
  scheduleId: string
  mobileNumber: string
  note?: string
  paymentMode: "CASH" | "ONLINE"
}
