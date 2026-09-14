import { mockDelay } from "@/lib/utils"
import { mockInvoices } from "@/services/mock/invoices"
import type { Invoice } from "@/types"

export async function getInvoices(patientName?: string): Promise<Invoice[]> {
  await mockDelay()
  if (!patientName) return mockInvoices
  return mockInvoices.filter((i) => i.patientName === patientName)
}
