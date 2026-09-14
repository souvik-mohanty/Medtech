import { useQuery } from "@tanstack/react-query"
import {
  Ban,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  FileCheck,
  FileClock,
  IndianRupee,
  TrendingUp,
  Users,
} from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { StatCard } from "@/components/common/StatCard"
import { DashboardSectionCard } from "@/components/layouts/DashboardShell"
import { LoadingState } from "@/components/common/LoadingState"
import { RevenueTrendChart } from "@/components/charts/RevenueTrendChart"
import { BookingTrendChart } from "@/components/charts/BookingTrendChart"
import { PopularTestsChart } from "@/components/charts/PopularTestsChart"
import { DistributionPieChart } from "@/components/charts/DistributionPieChart"
import { getOwnerAnalytics } from "@/services/api/analyticsApi"
import { formatCurrency } from "@/lib/utils"

export function OwnerDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["owner-analytics"], queryFn: getOwnerAnalytics })

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <LoadingState rows={6} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="An overview of your laboratory's activity today." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Patients" value={data.totalPatients.toString()} icon={Users} />
        <StatCard label="Today's Bookings" value={data.todaysBookings.toString()} icon={CalendarDays} />
        <StatCard label="Upcoming Collections" value={data.upcomingCollections.toString()} icon={CalendarCheck} tone="warning" />
        <StatCard label="Pending Reports" value={data.pendingReports.toString()} icon={FileClock} tone="warning" />
        <StatCard label="Completed Reports" value={data.completedReports.toString()} icon={FileCheck} tone="success" />
        <StatCard label="Total Revenue" value={formatCurrency(data.totalRevenue)} icon={IndianRupee} tone="success" />
        <StatCard label="Today's Revenue" value={formatCurrency(data.todaysRevenue)} icon={TrendingUp} tone="success" />
        <StatCard label="Pending Payments" value={data.pendingPayments.toString()} icon={CreditCard} tone="warning" />
        <StatCard label="Cancelled Bookings" value={data.cancelledBookings.toString()} icon={Ban} tone="destructive" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Revenue trend (last 7 days)</h2>
          <RevenueTrendChart data={data.revenueTrend} />
        </DashboardSectionCard>
        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Booking trend (last 7 days)</h2>
          <BookingTrendChart data={data.bookingTrend} />
        </DashboardSectionCard>
        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Most popular tests</h2>
          <PopularTestsChart data={data.popularTests} />
        </DashboardSectionCard>
        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Test category distribution</h2>
          <DistributionPieChart data={data.categoryDistribution} />
        </DashboardSectionCard>
        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Collection method distribution</h2>
          <DistributionPieChart data={data.collectionMethodDistribution} />
        </DashboardSectionCard>
        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Booking status distribution</h2>
          <DistributionPieChart data={data.bookingStatusDistribution} />
        </DashboardSectionCard>
      </div>
    </div>
  )
}
