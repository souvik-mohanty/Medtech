import type { PaymentHistoryEntry } from "./payment"

export type CollectionMethod = "HOME_COLLECTION" | "LAB_VISIT"

export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "SAMPLE_COLLECTION_SCHEDULED"
  | "SAMPLE_COLLECTED"
  | "PROCESSING"
  | "REPORT_READY"
  | "COMPLETED"
  | "CANCELLED"
  | "PAYMENT_FAILED"

export type CollectionStatus =
  | "SCHEDULED"
  | "ASSIGNED"
  | "SAMPLE_COLLECTED"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED"

export interface BookingLineItem {
  testId: string
  testName: string
  price: number
}

export type BookingSource = "PATIENT_ONLINE" | "FRANCHISE_COUNTER"

export interface Booking {
  id: string
  patientId: string | null
  patientName: string
  /** The walk-in customer's phone for a FRANCHISE_COUNTER booking, or the patient's own profile phone otherwise. */
  phone?: string
  source: BookingSource
  forFamilyMemberId?: string
  forFamilyMemberName?: string
  items: BookingLineItem[]
  packageId?: string
  packageName?: string
  collectionMethod: CollectionMethod
  addressId?: string
  addressLabel?: string
  addressLine1?: string
  addressLine2?: string
  addressCity?: string
  addressState?: string
  addressPincode?: string
  collectionDate: string
  /** Only meaningful for HOME_COLLECTION — a lab visit has no fixed time window. */
  collectionSlot?: string
  collectionStatus: CollectionStatus
  status: BookingStatus
  subtotal: number
  discount: number
  collectionCharge: number
  gst: number
  totalAmount: number
  paymentStatus: "PENDING" | "PARTIALLY_PAID" | "SUCCESS" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED"
  amountPaid: number
  couponCode?: string
  createdAt: string
  hasReport: boolean
  /** Only set while hasReport is true — the report is auto-deleted from the server after this date. */
  reportExpiresAt?: string
  /** Only set on owner-entered walk-in bookings. */
  referralId?: string
  referralName?: string
  referralCommission?: number
  paymentHistory: PaymentHistoryEntry[]
  /** Only set for an unpaid online booking — what Razorpay Checkout.js opens against. Undefined once paid, or for CASH. */
  razorpayOrderId?: string
}
