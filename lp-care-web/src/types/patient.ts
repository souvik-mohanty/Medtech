export type Gender = "MALE" | "FEMALE" | "OTHER"

export interface Address {
  id: string
  label: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export interface FamilyMember {
  id: string
  fullName: string
  relation: string
  gender: Gender
  dateOfBirth: string
}

export interface PatientProfile {
  id: string
  fullName: string
  phone: string
  email?: string
  gender?: Gender
  dateOfBirth?: string
  addresses: Address[]
  familyMembers: FamilyMember[]
  createdAt: string
}

/** Owner-facing summary row — deliberately excludes sensitive medical detail. */
export interface PatientSummary {
  id: string
  fullName: string
  phone: string
  email?: string
  totalBookings: number
  lastBookingDate?: string
  status: "ACTIVE" | "INACTIVE"
}
