import { apiClient } from "@/lib/apiClient"
import type { Address, FamilyMember, Gender, PatientProfile, PatientSummary } from "@/types"

interface BackendAddress {
  id: string
  label: string
  line1: string
  line2: string | null
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

interface BackendFamilyMember {
  id: string
  fullName: string
  relation: string
  gender: Gender
  dateOfBirth: string
}

interface BackendPatientProfile {
  id: string
  fullName: string | null
  phone: string | null
  email: string | null
  gender: Gender | null
  dateOfBirth: string | null
  addresses: BackendAddress[]
  familyMembers: BackendFamilyMember[]
  createdAt: string
}

function toAddress(a: BackendAddress): Address {
  return { id: a.id, label: a.label, line1: a.line1, line2: a.line2 ?? undefined, city: a.city, state: a.state, pincode: a.pincode, isDefault: a.isDefault }
}

function toFamilyMember(m: BackendFamilyMember): FamilyMember {
  return { id: m.id, fullName: m.fullName, relation: m.relation, gender: m.gender, dateOfBirth: m.dateOfBirth }
}

function toPatientProfile(p: BackendPatientProfile): PatientProfile {
  return {
    id: p.id,
    fullName: p.fullName ?? "",
    phone: p.phone ?? "",
    email: p.email ?? undefined,
    gender: p.gender ?? undefined,
    dateOfBirth: p.dateOfBirth ?? undefined,
    addresses: p.addresses.map(toAddress),
    familyMembers: p.familyMembers.map(toFamilyMember),
    createdAt: p.createdAt,
  }
}

export async function getCurrentPatient(): Promise<PatientProfile> {
  const response = await apiClient.get<{ data: BackendPatientProfile }>("/api/patient/profile")
  return toPatientProfile(response.data.data)
}

export async function updatePatientProfile(
  update: Partial<Pick<PatientProfile, "fullName" | "phone" | "email" | "gender" | "dateOfBirth">>,
): Promise<PatientProfile> {
  const response = await apiClient.put<{ data: BackendPatientProfile }>("/api/patient/profile", update)
  return toPatientProfile(response.data.data)
}

export async function addFamilyMember(member: Omit<FamilyMember, "id">): Promise<PatientProfile> {
  const response = await apiClient.post<{ data: BackendPatientProfile }>("/api/patient/family-members", member)
  return toPatientProfile(response.data.data)
}

export async function updateFamilyMember(id: string, update: Partial<Omit<FamilyMember, "id">>): Promise<PatientProfile> {
  const response = await apiClient.put<{ data: BackendPatientProfile }>(`/api/patient/family-members/${id}`, update)
  return toPatientProfile(response.data.data)
}

export async function deleteFamilyMember(id: string): Promise<PatientProfile> {
  const response = await apiClient.delete<{ data: BackendPatientProfile }>(`/api/patient/family-members/${id}`)
  return toPatientProfile(response.data.data)
}

export async function addAddress(address: Omit<Address, "id">): Promise<PatientProfile> {
  const response = await apiClient.post<{ data: BackendPatientProfile }>("/api/patient/addresses", address)
  return toPatientProfile(response.data.data)
}

// ---- Owner-facing patient directory ----

export interface PatientListFilters {
  search?: string
  status?: "ALL" | "ACTIVE" | "INACTIVE"
}

export async function getPatientSummaries(filters: PatientListFilters = {}): Promise<PatientSummary[]> {
  const response = await apiClient.get<{ data: PatientSummary[] }>("/api/franchise/patients", {
    params: { search: filters.search || undefined, status: filters.status },
  })
  return response.data.data
}
