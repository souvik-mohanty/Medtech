export type PaymentStatus =
  | "CREATED"
  | "PENDING"
  | "PARTIALLY_PAID"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"

/** One payment event, as opposed to a single running amountPaid total — see PaymentHistoryEntryResponse on the backend. */
export interface PaymentHistoryEntry {
  amount: number
  recordedAt: string
}

export interface Payment {
  id: string
  bookingId: string
  patientName: string
  amount: number
  amountPaid: number
  method: "UPI" | "CARD" | "NETBANKING" | "WALLET" | "CASH"
  status: PaymentStatus
  refundStatus?: "NONE" | "INITIATED" | "COMPLETED"
  createdAt: string
}
