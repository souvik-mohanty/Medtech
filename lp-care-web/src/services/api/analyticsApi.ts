import { getOwnerBookings } from "@/services/api/bookingsApi"
import { getOwnerOrders } from "@/services/api/ordersApi"
import { getPatientSummaries } from "@/services/api/patientsApi"
import { getAllTests } from "@/services/api/testsApi"
import type { Booking, BookingStatus, CategoryShare, OwnerAnalytics } from "@/types"

const NOT_YET_COLLECTED: BookingStatus[] = ["PENDING_PAYMENT", "CONFIRMED", "SAMPLE_COLLECTION_SCHEDULED", "PAYMENT_FAILED"]

function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

function prettify(value: string): string {
  return value
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ")
}

function topEntries(counts: Map<string, number>, limit: number): CategoryShare[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category, value]) => ({ category, value }))
}

/**
 * Computed entirely from real data already served by the owner-facing
 * booking/order/patient/test endpoints — no separate analytics backend
 * module, and no invented numbers. Recomputed on every call rather than
 * cached, since the underlying data changes with every booking/order.
 */
export async function getOwnerAnalytics(): Promise<OwnerAnalytics> {
  const [bookings, orders, patients, tests] = await Promise.all([
    getOwnerBookings(),
    getOwnerOrders(),
    getPatientSummaries(),
    getAllTests(),
  ])

  const categoryByTestId = new Map(tests.map((t) => [t.id, t.category as string]))
  const today = new Date()
  const todayKey = dayKey(today.toISOString())

  const activeBookings = bookings.filter((b) => b.status !== "CANCELLED")
  const cancelledBookings = bookings.filter((b) => b.status === "CANCELLED").length

  const todaysBookings = bookings.filter((b) => dayKey(b.createdAt) === todayKey).length
  const upcomingCollections = activeBookings.filter(
    (b) => (b.collectionStatus === "SCHEDULED" || b.collectionStatus === "ASSIGNED") && b.collectionDate >= todayKey,
  ).length
  const pendingReports = activeBookings.filter((b) => !b.hasReport && !NOT_YET_COLLECTED.includes(b.status)).length
  const completedReports = bookings.filter((b) => b.hasReport).length

  const bookingRevenue = (list: Booking[]) => list.reduce((sum, b) => sum + b.amountPaid, 0)
  const orderRevenue = orders.filter((o) => o.status === "PAID").reduce((sum, o) => sum + o.totalAmount, 0)
  const todaysOrderRevenue = orders
    .filter((o) => o.status === "PAID" && dayKey(o.createdAt) === todayKey)
    .reduce((sum, o) => sum + o.totalAmount, 0)

  const totalRevenue = bookingRevenue(bookings) + orderRevenue
  const todaysRevenue = bookingRevenue(bookings.filter((b) => dayKey(b.createdAt) === todayKey)) + todaysOrderRevenue

  const pendingPayments =
    bookings.filter((b) => b.paymentStatus === "PENDING" || b.paymentStatus === "PARTIALLY_PAID").length +
    orders.filter((o) => o.status === "PAYMENT_PENDING").length

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    return d
  })
  const revenueTrend = last7Days.map((d) => {
    const key = dayKey(d.toISOString())
    const revenue =
      bookings.filter((b) => dayKey(b.createdAt) === key).reduce((sum, b) => sum + b.amountPaid, 0) +
      orders.filter((o) => o.status === "PAID" && dayKey(o.createdAt) === key).reduce((sum, o) => sum + o.totalAmount, 0)
    return { date: dayLabel(d), revenue }
  })
  const bookingTrend = last7Days.map((d) => {
    const key = dayKey(d.toISOString())
    return { date: dayLabel(d), bookings: bookings.filter((b) => dayKey(b.createdAt) === key).length }
  })

  const testCounts = new Map<string, number>()
  const categoryCounts = new Map<string, number>()
  for (const booking of activeBookings) {
    for (const item of booking.items) {
      testCounts.set(item.testName, (testCounts.get(item.testName) ?? 0) + 1)
      const category = categoryByTestId.get(item.testId) ?? "Other"
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1)
    }
  }

  const collectionMethodCounts = new Map<string, number>()
  for (const booking of activeBookings) {
    const label = booking.collectionMethod === "HOME_COLLECTION" ? "Home Collection" : "Lab Visit"
    collectionMethodCounts.set(label, (collectionMethodCounts.get(label) ?? 0) + 1)
  }

  const statusCounts = new Map<string, number>()
  for (const booking of bookings) {
    const label = prettify(booking.status)
    statusCounts.set(label, (statusCounts.get(label) ?? 0) + 1)
  }

  return {
    totalPatients: patients.length,
    todaysBookings,
    upcomingCollections,
    pendingReports,
    completedReports,
    totalRevenue,
    todaysRevenue,
    pendingPayments,
    cancelledBookings,
    revenueTrend,
    bookingTrend,
    popularTests: topEntries(testCounts, 5),
    categoryDistribution: topEntries(categoryCounts, 6),
    collectionMethodDistribution: topEntries(collectionMethodCounts, 2),
    bookingStatusDistribution: topEntries(statusCounts, 8),
  }
}
