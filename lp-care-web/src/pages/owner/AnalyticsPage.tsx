import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { IndianRupee, Repeat, TrendingUp, Users } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { StatCard } from "@/components/common/StatCard"
import { DashboardSectionCard } from "@/components/layouts/DashboardShell"
import { LoadingState } from "@/components/common/LoadingState"
import { RevenueTrendChart } from "@/components/charts/RevenueTrendChart"
import { BookingTrendChart } from "@/components/charts/BookingTrendChart"
import { DistributionPieChart } from "@/components/charts/DistributionPieChart"
import { PopularTestsChart } from "@/components/charts/PopularTestsChart"
import { getOwnerAnalytics } from "@/services/api/analyticsApi"
import { getOwnerBookings } from "@/services/api/bookingsApi"
import { formatCurrency } from "@/lib/utils"

export function OwnerAnalyticsPage() {
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({ queryKey: ["owner-analytics"], queryFn: getOwnerAnalytics })
  const { data: bookings, isLoading: loadingBookings } = useQuery({ queryKey: ["owner-analytics-bookings"], queryFn: () => getOwnerBookings() })

  const derived = useMemo(() => {
    const all = bookings ?? []
    const completedOrPaid = all.filter((b) => b.paymentStatus === "SUCCESS")
    const avgOrderValue = completedOrPaid.length ? completedOrPaid.reduce((sum, b) => sum + b.totalAmount, 0) / completedOrPaid.length : 0
    const byPatient = new Map<string, number>()
    all.forEach((b) => {
      if (!b.patientId) return
      byPatient.set(b.patientId, (byPatient.get(b.patientId) ?? 0) + 1)
    })
    const repeatPatients = [...byPatient.values()].filter((count) => count > 1).length
    const homeCollectionRevenue = all.reduce((sum, b) => sum + b.collectionCharge, 0)
    return { avgOrderValue, repeatPatients, homeCollectionRevenue }
  }, [bookings])

  if (loadingAnalytics || !analytics) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <LoadingState rows={6} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Analytics" description="Deeper revenue and booking analytics beyond the dashboard overview." />

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Avg. order value" value={loadingBookings ? "—" : formatCurrency(Math.round(derived.avgOrderValue))} icon={TrendingUp} />
        <StatCard label="Repeat patients" value={loadingBookings ? "—" : String(derived.repeatPatients)} icon={Repeat} tone="success" />
        <StatCard label="Collection charge revenue" value={loadingBookings ? "—" : formatCurrency(derived.homeCollectionRevenue)} icon={IndianRupee} />
        <StatCard label="Total patients" value={String(analytics.totalPatients)} icon={Users} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Revenue trend</h2>
          <RevenueTrendChart data={analytics.revenueTrend} />
        </DashboardSectionCard>
        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Booking trend</h2>
          <BookingTrendChart data={analytics.bookingTrend} />
        </DashboardSectionCard>
        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Most popular tests</h2>
          <PopularTestsChart data={analytics.popularTests} />
        </DashboardSectionCard>
        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Test category distribution</h2>
          <DistributionPieChart data={analytics.categoryDistribution} />
        </DashboardSectionCard>
        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Collection method distribution</h2>
          <DistributionPieChart data={analytics.collectionMethodDistribution} />
        </DashboardSectionCard>
        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Booking status distribution</h2>
          <DistributionPieChart data={analytics.bookingStatusDistribution} />
        </DashboardSectionCard>
      </div>
    </div>
  )
}
