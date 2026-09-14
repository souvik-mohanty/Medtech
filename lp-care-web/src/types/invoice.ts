export interface InvoiceLineItem {
  description: string
  amount: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  bookingId: string
  paymentReference: string
  patientName: string
  lineItems: InvoiceLineItem[]
  discount: number
  gst: number
  totalAmount: number
  gstin?: string
  issuedAt: string
}
