import type { PaymentHistoryEntry } from "./payment"

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
