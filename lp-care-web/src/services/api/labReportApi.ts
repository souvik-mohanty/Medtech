import { apiClient } from "@/lib/apiClient"

export async function uploadLabReport(bookingId: string, file: File): Promise<void> {
  const formData = new FormData()
  formData.append("file", file)
  await apiClient.post(`/api/franchise/labtests/bookings/${bookingId}/report`, formData)
}

async function fetchReportBlob(url: string): Promise<Blob> {
  const response = await apiClient.get<Blob>(url, { responseType: "blob" })
  return response.data
}

/** Opens the report PDF in a new tab. */
export async function viewOwnerReport(bookingId: string): Promise<void> {
  const blob = await fetchReportBlob(`/api/franchise/labtests/bookings/${bookingId}/report`)
  window.open(URL.createObjectURL(blob), "_blank")
}

export async function viewPatientReport(bookingId: string): Promise<void> {
  const blob = await fetchReportBlob(`/api/patient/labtests/bookings/${bookingId}/report`)
  window.open(URL.createObjectURL(blob), "_blank")
}
