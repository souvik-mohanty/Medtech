export type ReportStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED"

export interface LabReport {
  id: string
  bookingId: string
  patientName: string
  testNames: string[]
  sampleCollectionDate: string
  reportGeneratedDate?: string
  status: ReportStatus
  laboratoryName: string
  fileUrl?: string
}
