import type { PaymentHistoryEntry } from "./payment"

export type SalesChannel = "ONLINE" | "WALKIN" | "BOTH"

export interface Product {
  id: string
  name: string
  unit?: string
  sellingPrice: number
  purchasePrice?: number
  mfgDate?: string
  purchaseDate?: string
  /** Who this stock was bought from. Optional. */
  supplier?: string
  expiryDate?: string
  stockQuantity: number
  gstPercentage: number
  prescriptionRequired: boolean
  active: boolean
  salesChannel: SalesChannel
}

export type OrderStatus = "CREATED" | "PAYMENT_PENDING" | "PAID" | "CONFIRMED" | "DISPATCHED" | "DELIVERED" | "CANCELLED"
export type OrderPaymentMode = "CASH" | "ONLINE"

export interface OrderItem {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  gstPercentage: number
  lineTotal: number
}

export interface Order {
  id: string
  franchiseId: string
  source: "PATIENT_ONLINE" | "FRANCHISE_COUNTER"
  customerName?: string
  customerPhone?: string
  patientEmail?: string
  /** Resolved display name for a PATIENT_ONLINE order — the patient's account name. Undefined for a counter sale (see customerName instead). */
  patientName?: string
  /** The ordering patient's mobile number, snapshotted at order time — PATIENT_ONLINE only. */
  mobileNumber?: string
  addressId?: string
  addressLabel?: string
  addressLine1?: string
  addressLine2?: string
  addressCity?: string
  addressState?: string
  addressPincode?: string
  items: OrderItem[]
  subtotal: number
  gstAmount: number
  discountAmount: number
  /** The coupon that produced discountAmount, if any. */
  couponCode?: string
  totalAmount: number
  paymentMode: OrderPaymentMode
  status: OrderStatus
  invoiceNumber?: string
  note?: string
  createdAt: string
  /** Only set for a counter sale that credits a referral. */
  referralId?: string
  referralName?: string
  referralCommission?: number
  paymentHistory: PaymentHistoryEntry[]
}
