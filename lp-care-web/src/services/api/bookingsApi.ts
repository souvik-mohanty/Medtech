import { apiClient } from "@/lib/apiClient"
import type { Booking, BookingLineItem, BookingSource, BookingStatus, CollectionMethod, CollectionStatus, Payment, PaymentHistoryEntry } from "@/types"

interface BackendBooking {
  id: string
  patientId: string | null
  patientEmail: string | null
  patientName: string
  phone: string | null
  source: BookingSource
  forFamilyMemberId: string | null
  forFamilyMemberName: string | null
  items: { testId: string | null; testName: string; price: number }[]
  packageId: string | null
  packageName: string | null
  collectionMethod: CollectionMethod
  addressId: string | null
  addressLabel: string | null
  addressLine1: string | null
  addressLine2: string | null
  addressCity: string | null
  addressState: string | null
  addressPincode: string | null
  collectionDate: string
  collectionSlot: string | null
  collectionStatus: CollectionStatus
  status: BookingStatus
  subtotal: number
  discount: number
  collectionCharge: number
  gst: number
  totalAmount: number
  paymentStatus: Booking["paymentStatus"]
  amountPaid: number
  couponCode: string | null
  createdAt: string
  paidAt: string | null
  hasReport: boolean
  reportExpiresAt: string | null
  referralId: string | null
  referralName: string | null
  referralCommission: number | null
  paymentHistory: PaymentHistoryEntry[]
}

function toBooking(b: BackendBooking): Booking {
  return {
    id: b.id,
    patientId: b.patientId ?? b.patientEmail,
    patientName: b.patientName,
    phone: b.phone ?? undefined,
    source: b.source,
    forFamilyMemberId: b.forFamilyMemberId ?? undefined,
    forFamilyMemberName: b.forFamilyMemberName ?? undefined,
    items: b.items.map((i) => ({ testId: i.testId ?? "", testName: i.testName, price: i.price }) satisfies BookingLineItem),
    packageId: b.packageId ?? undefined,
    packageName: b.packageName ?? undefined,
    collectionMethod: b.collectionMethod,
    addressId: b.addressId ?? undefined,
    addressLabel: b.addressLabel ?? undefined,
    addressLine1: b.addressLine1 ?? undefined,
    addressLine2: b.addressLine2 ?? undefined,
    addressCity: b.addressCity ?? undefined,
    addressState: b.addressState ?? undefined,
    addressPincode: b.addressPincode ?? undefined,
    collectionDate: b.collectionDate,
    collectionSlot: b.collectionSlot ?? undefined,
    collectionStatus: b.collectionStatus,
    status: b.status,
    subtotal: b.subtotal,
    discount: b.discount,
    collectionCharge: b.collectionCharge,
    gst: b.gst,
    totalAmount: b.totalAmount,
    paymentStatus: b.paymentStatus,
    amountPaid: b.amountPaid,
    couponCode: b.couponCode ?? undefined,
    createdAt: b.createdAt,
    hasReport: b.hasReport,
    reportExpiresAt: b.reportExpiresAt ?? undefined,
    referralId: b.referralId ?? undefined,
    referralName: b.referralName ?? undefined,
    referralCommission: b.referralCommission ?? undefined,
    paymentHistory: b.paymentHistory,
  }
}

// ---- Patient-facing (the caller's own bookings, scoped by JWT identity) ----

export async function getMyBookings(): Promise<Booking[]> {
  const response = await apiClient.get<{ data: BackendBooking[] }>("/api/patient/labtests/bookings")
  return response.data.data.map(toBooking)
}

export async function getBookingById(id: string): Promise<Booking | undefined> {
  const response = await apiClient.get<{ data: BackendBooking }>(`/api/patient/labtests/bookings/${id}`)
  return toBooking(response.data.data)
}

export interface CreateBookingInput {
  franchiseId: string
  items: BookingLineItem[]
  testIds?: string[]
  packageId?: string
  packageName?: string
  forFamilyMemberId?: string
  forFamilyMemberName?: string
  collectionMethod: CollectionMethod
  addressId?: string
  addressLabel?: string
  collectionDate: string
  /** Required only for HOME_COLLECTION — a lab visit has no fixed time window. */
  collectionSlot?: string
  couponCode?: string
  discount: number
  paymentMethod: Payment["method"]
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const response = await apiClient.post<{ data: BackendBooking }>("/api/patient/labtests/bookings", {
    franchiseId: input.franchiseId,
    testIds: input.packageId ? undefined : input.items.map((i) => i.testId),
    packageId: input.packageId,
    forFamilyMemberId: input.forFamilyMemberId,
    collectionMethod: input.collectionMethod,
    addressId: input.addressId,
    collectionDate: input.collectionDate,
    collectionSlot: input.collectionSlot,
    couponCode: input.couponCode,
    paymentMethod: input.paymentMethod,
  })
  return toBooking(response.data.data)
}

// ---- Owner-facing (every booking across the franchise) ----

export interface OwnerBookingFilters {
  patientId?: string
  status?: BookingStatus | "ALL"
  search?: string
}

export async function getOwnerBookings(filters: OwnerBookingFilters = {}): Promise<Booking[]> {
  const response = await apiClient.get<{ data: BackendBooking[] }>("/api/franchise/labtests/bookings")
  let results = response.data.data.map(toBooking)
  if (filters.patientId) results = results.filter((b) => b.patientId === filters.patientId)
  if (filters.status && filters.status !== "ALL") results = results.filter((b) => b.status === filters.status)
  if (filters.search) {
    const term = filters.search.toLowerCase()
    results = results.filter((b) => b.id.toLowerCase().includes(term) || b.patientName.toLowerCase().includes(term))
  }
  return results
}

/** Owner action — confirms a CASH booking's payment was collected on visit. */
export async function markBookingCashPaid(id: string): Promise<Booking> {
  const response = await apiClient.patch<{ data: BackendBooking }>(`/api/franchise/labtests/bookings/${id}/mark-paid`)
  return toBooking(response.data.data)
}

/** Owner action — advances a booking's sample-collection status (and the overall booking status along with it). */
export async function updateCollectionStatus(id: string, collectionStatus: CollectionStatus): Promise<Booking> {
  const response = await apiClient.patch<{ data: BackendBooking }>(`/api/franchise/labtests/bookings/${id}/collection-status`, {
    collectionStatus,
  })
  return toBooking(response.data.data)
}

/** Owner action — cancels a booking outright. */
export async function cancelBooking(id: string): Promise<Booking> {
  const response = await apiClient.patch<{ data: BackendBooking }>(`/api/franchise/labtests/bookings/${id}/cancel`)
  return toBooking(response.data.data)
}

/** Owner action — records an additional payment collected towards a booking, on top of whatever's already been paid. */
export async function recordPayment(id: string, amount: number): Promise<Booking> {
  const response = await apiClient.patch<{ data: BackendBooking }>(`/api/franchise/labtests/bookings/${id}/record-payment`, { amount })
  return toBooking(response.data.data)
}

export interface CreateWalkInBookingInput {
  customerName: string
  customerPhone?: string
  /** Optional — if given, this booking (and its report once uploaded) becomes visible once the customer logs in with this email. */
  patientEmail?: string
  testIds?: string[]
  packageId?: string
  couponCode?: string
  /** How much the customer is paying right now. Omit/0 = pending, less than the total = partially paid, at/above = fully paid. */
  amountPaid?: number
  referralId?: string
  /** Optional — lets the owner backdate a walk-in entered after the fact. Defaults to now if omitted. */
  createdAt?: string
}

/** Owner action — books a walk-in patient at the counter. Always LAB_VISIT, marked collected immediately. */
export async function createWalkInBooking(input: CreateWalkInBookingInput): Promise<Booking> {
  const response = await apiClient.post<{ data: BackendBooking }>("/api/franchise/labtests/bookings/walk-in", {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    patientEmail: input.patientEmail,
    testIds: input.packageId ? undefined : input.testIds,
    packageId: input.packageId,
    couponCode: input.couponCode,
    amountPaid: input.amountPaid,
    referralId: input.referralId,
    createdAt: input.createdAt,
  })
  return toBooking(response.data.data)
}

/** Opens the booking's invoice PDF in a new tab. */
export async function viewOwnerBookingInvoice(id: string): Promise<void> {
  const response = await apiClient.get<Blob>(`/api/franchise/labtests/bookings/${id}/invoice`, { responseType: "blob" })
  window.open(URL.createObjectURL(response.data), "_blank")
}

/** Opens the booking's invoice PDF in a new tab — for the patient's own booking. */
export async function viewMyBookingInvoice(id: string): Promise<void> {
  const response = await apiClient.get<Blob>(`/api/patient/labtests/bookings/${id}/invoice`, { responseType: "blob" })
  window.open(URL.createObjectURL(response.data), "_blank")
}
