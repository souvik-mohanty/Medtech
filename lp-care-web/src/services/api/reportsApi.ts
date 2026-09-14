import { mockDelay } from "@/lib/utils"
import { mockReports } from "@/services/mock/reports"
import type { LabReport } from "@/types"

let reports: LabReport[] = structuredClone(mockReports)

export async function getReports(patientName?: string): Promise<LabReport[]> {
  await mockDelay()
  if (!patientName) return reports
  return reports.filter((r) => r.patientName === patientName)
}

export async function getReportById(id: string): Promise<LabReport | undefined> {
  await mockDelay(300)
  return reports.find((r) => r.id === id)
}

/** Owner action — moves a report from PROCESSING/PENDING to READY. */
export async function markReportReady(id: string): Promise<LabReport> {
  await mockDelay(500)
  reports = reports.map((r) => (r.id === id ? { ...r, status: "READY", reportGeneratedDate: new Date().toISOString().slice(0, 10) } : r))
  const updated = reports.find((r) => r.id === id)
  if (!updated) throw new Error("Report not found")
  return updated
}
