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
  /** Only meaningful for LIMITED — how many patients have been seen so far, plus one. The FIFO queue position a new booking would join. */
  currentServingSerial?: number
  fee: number
  active: boolean
  /** Null/undefined = bookable immediately. Otherwise patients can't book until this moment. */
  bookingOpensAt?: string
}

export type CreateDoctorScheduleInput = Omit<DoctorSchedule, "id" | "bookedCount" | "currentServingSerial" | "active">

export interface DoctorAppointment {
  id: string
  scheduleId: string
  patientEmail?: string
  /** Only set on an owner-entered walk-in appointment with no linked patient account yet. */
  customerName?: string
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
  /** Set by the owner once the doctor has actually seen this patient — independent of payment status. */
  completed: boolean
  completedAt?: string
}

export interface BookAppointmentInput {
  scheduleId: string
  mobileNumber: string
  note?: string
  paymentMode: "CASH" | "ONLINE"
}

export interface WalkInAppointmentInput {
  scheduleId: string
  customerName: string
  mobileNumber: string
  /** Optional — if given, this appointment becomes visible once the patient logs in with this email. */
  patientEmail?: string
  note?: string
  /** Whether the fee was collected right now (true) or is still owed (false, confirmed later via mark-paid). */
  paidNow: boolean
  /** Optional — lets the owner backdate a walk-in entered after the fact. Defaults to now if omitted. */
  createdAt?: string
}
