import { apiClient } from "@/lib/apiClient"
import type { Payment, PaymentStatus } from "@/types"

interface BackendPayment {
  id: string
  bookingId: string
  patientName: string
  amount: number
  amountPaid: number
  method: Payment["method"]
  status: PaymentStatus
  refundStatus: NonNullable<Payment["refundStatus"]>
  createdAt: string
}

function toPayment(p: BackendPayment): Payment {
  return {
    id: p.id,
    bookingId: p.bookingId,
    patientName: p.patientName,
    amount: p.amount,
    amountPaid: p.amountPaid,
    method: p.method,
    status: p.status,
    refundStatus: p.refundStatus,
    createdAt: p.createdAt,
  }
}

export async function getMyPayments(status?: PaymentStatus | "ALL"): Promise<Payment[]> {
  const response = await apiClient.get<{ data: BackendPayment[] }>("/api/patient/payments")
  const payments = response.data.data.map(toPayment)
  return !status || status === "ALL" ? payments : payments.filter((p) => p.status === status)
}

export async function getOwnerPayments(status?: PaymentStatus | "ALL"): Promise<Payment[]> {
  const response = await apiClient.get<{ data: BackendPayment[] }>("/api/franchise/payments")
  const payments = response.data.data.map(toPayment)
  return !status || status === "ALL" ? payments : payments.filter((p) => p.status === status)
}
