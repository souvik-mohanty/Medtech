import { apiClient } from "@/lib/apiClient"
import type { Order, OrderItem, OrderPaymentMode, OrderStatus, PaymentHistoryEntry } from "@/types"

interface BackendOrder {
  id: string
  franchiseId: string
  source: Order["source"]
  customerName: string | null
  customerPhone: string | null
  patientEmail: string | null
  items: OrderItem[]
  subtotal: number
  gstAmount: number
  discountAmount: number
  couponCode: string | null
  totalAmount: number
  paymentMode: OrderPaymentMode
  status: OrderStatus
  invoiceNumber: string | null
  note: string | null
  createdAt: string
  referralId: string | null
  referralName: string | null
  referralCommission: number | null
  paymentHistory: PaymentHistoryEntry[]
}

function toOrder(o: BackendOrder): Order {
  return {
    id: o.id,
    franchiseId: o.franchiseId,
    source: o.source,
    customerName: o.customerName ?? undefined,
    customerPhone: o.customerPhone ?? undefined,
    patientEmail: o.patientEmail ?? undefined,
    items: o.items,
    subtotal: o.subtotal,
    gstAmount: o.gstAmount,
    discountAmount: o.discountAmount,
    couponCode: o.couponCode ?? undefined,
    totalAmount: o.totalAmount,
    paymentMode: o.paymentMode,
    status: o.status,
    invoiceNumber: o.invoiceNumber ?? undefined,
    note: o.note ?? undefined,
    createdAt: o.createdAt,
    referralId: o.referralId ?? undefined,
    referralName: o.referralName ?? undefined,
    referralCommission: o.referralCommission ?? undefined,
    paymentHistory: o.paymentHistory,
  }
}

// ---- Patient-facing ----

export interface CreateOrderInput {
  franchiseId: string
  items: { productId: string; quantity: number }[]
  paymentMode: OrderPaymentMode
}

/** CASH always succeeds and stays PAYMENT_PENDING until the owner confirms it. ONLINE requires the franchise to have a payment gateway configured. */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const response = await apiClient.post<{ data: BackendOrder }>("/api/patient/orders", input)
  return toOrder(response.data.data)
}

export async function getMyOrders(): Promise<Order[]> {
  const response = await apiClient.get<{ data: BackendOrder[] }>("/api/patient/orders")
  return response.data.data.map(toOrder)
}

// ---- Owner-facing ----

export interface CreateCounterBillInput {
  items: { productId: string; quantity: number }[]
  customerName?: string
  customerPhone?: string
  discountType?: "FLAT" | "PERCENTAGE"
  discountValue?: number
  couponCode?: string
  note?: string
  referralId?: string
  /** Optional — lets the owner backdate a walk-in sale entered after the fact. Defaults to now if omitted. */
  createdAt?: string
}

/** Owner action — a walk-in medicine/equipment purchase at the counter. Paid in cash and invoiced immediately. */
export async function createCounterBill(input: CreateCounterBillInput): Promise<Order> {
  const response = await apiClient.post<{ data: BackendOrder }>("/api/franchise/billing/bills", input)
  return toOrder(response.data.data)
}

export async function getOwnerOrders(): Promise<Order[]> {
  const response = await apiClient.get<{ data: BackendOrder[] }>("/api/franchise/billing/bills")
  return response.data.data.map(toOrder)
}

/** Confirms a CASH online order was actually paid (on delivery/pickup) — deducts stock and assigns the invoice number. */
export async function markOrderPaid(id: string): Promise<Order> {
  const response = await apiClient.patch<{ data: BackendOrder }>(`/api/franchise/billing/bills/${id}/mark-paid`)
  return toOrder(response.data.data)
}

export async function viewOwnerInvoice(id: string): Promise<void> {
  const response = await apiClient.get<Blob>(`/api/franchise/billing/bills/${id}/invoice`, { responseType: "blob" })
  window.open(URL.createObjectURL(response.data), "_blank")
}
