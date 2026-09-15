import { getMyBookings } from "@/services/api/bookingsApi"
import type { LabReport } from "@/types"

/**
 * Derived from the patient's own real bookings (getMyBookings) — a booking
 * with hasReport true means the owner has uploaded a real report PDF (see
 * labReportApi#uploadLabReport/viewPatientReport, which serve the actual
 * file). This only powers the dashboard's "Recent reports" summary widget;
 * reportGeneratedDate isn't tracked on the booking itself, so it's left
 * unset rather than invented.
 */
export async function getReports(patientName?: string): Promise<LabReport[]> {
  const bookings = await getMyBookings()
  return bookings
    .filter((b) => b.hasReport && (!patientName || b.patientName === patientName))
    .map((b) => ({
      id: b.id,
      bookingId: b.id,
      patientName: b.patientName,
      testNames: b.packageName ? [b.packageName] : b.items.map((i) => i.testName),
      sampleCollectionDate: b.collectionDate,
      status: "READY" as const,
      laboratoryName: "",
    }))
}
