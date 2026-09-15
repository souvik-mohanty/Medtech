import { Link, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Bell, Calendar, ClipboardCheck, CreditCard, FileText, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { DashboardSectionCard } from "@/components/layouts/DashboardShell"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getMyBookings } from "@/services/api/bookingsApi"
import { getReports } from "@/services/api/reportsApi"
import { getPackages } from "@/services/api/testsApi"
import { getMyNotifications } from "@/services/api/notificationsApi"
import { useAuthStore } from "@/app/store/authStore"
import { formatCurrency, formatDate } from "@/lib/utils"

export function PatientDashboardPage() {
  const navigate = useNavigate()
  const name = useAuthStore((s) => s.session?.user.fullName) || "there"

  const { data: bookings, isLoading: loadingBookings } = useQuery({
    queryKey: ["bookings", "mine"],
    queryFn: getMyBookings,
  })
  const { data: reports } = useQuery({ queryKey: ["reports", "Ananya Sharma"], queryFn: () => getReports("Ananya Sharma") })
  const { data: packages } = useQuery({ queryKey: ["packages", "dashboard"], queryFn: getPackages })
  const { data: notifications } = useQuery({ queryKey: ["notifications", "mine"], queryFn: getMyNotifications })

  const upcoming = bookings?.find((b) => !["COMPLETED", "CANCELLED"].includes(b.status))
  const pendingPayments = bookings?.filter((b) => b.paymentStatus === "PENDING") ?? []
  const readyReports = reports?.filter((r) => r.status === "READY") ?? []
  const unreadNotifications = notifications?.filter((n) => !n.read) ?? []

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${name.split(" ")[0]}`}
        description="Here's what's happening with your health checkups."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <DashboardSectionCard>
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><Calendar className="size-4 text-primary" /> Upcoming booking</h2>
            {loadingBookings ? (
              <LoadingState rows={1} />
            ) : upcoming ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div>
                  <p className="font-medium">{upcoming.packageName ?? upcoming.items.map((i) => i.testName).join(", ")}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Truck className="size-3.5" />
                    {upcoming.collectionMethod === "HOME_COLLECTION" ? "Home collection" : "Lab visit"} ·{" "}
                    {formatDate(upcoming.collectionDate)} · {upcoming.collectionSlot}
                  </p>
                </div>
                <StatusBadge status={upcoming.status} />
              </div>
            ) : (
              <EmptyState title="No upcoming bookings" description="Browse tests to start a booking." actionLabel="Browse Tests" onAction={() => navigate("/patient/tests")} />
            )}
          </DashboardSectionCard>

          <DashboardSectionCard>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold"><ClipboardCheck className="size-4 text-primary" /> Recent bookings</h2>
              <Link to="/patient/bookings" className="text-sm font-medium text-primary hover:underline">View all</Link>
            </div>
            {loadingBookings ? (
              <LoadingState rows={3} />
            ) : bookings && bookings.length > 0 ? (
              <div className="divide-y">
                {bookings.slice(0, 4).map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{b.packageName ?? b.items.map((i) => i.testName).join(", ")}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(b.createdAt)} · {formatCurrency(b.totalAmount)}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No bookings yet" />
            )}
          </DashboardSectionCard>
        </div>

        <div className="space-y-5">
          <DashboardSectionCard>
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><CreditCard className="size-4 text-primary" /> Pending payments</h2>
            {pendingPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending payments.</p>
            ) : (
              <div className="space-y-2">
                {pendingPayments.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span className="font-medium">{formatCurrency(b.totalAmount)}</span>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/patient/payments">Pay now</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </DashboardSectionCard>

          <DashboardSectionCard>
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><FileText className="size-4 text-primary" /> Recent reports</h2>
            {readyReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reports ready yet.</p>
            ) : (
              <div className="space-y-2">
                {readyReports.slice(0, 3).map((r) => (
                  <Link key={r.id} to="/patient/reports" className="block rounded-lg border p-3 text-sm hover:bg-muted/50">
                    <p className="font-medium">{r.testNames[0]}{r.testNames.length > 1 ? ` +${r.testNames.length - 1} more` : ""}</p>
                    <p className="text-xs text-muted-foreground">Ready · {r.reportGeneratedDate && formatDate(r.reportGeneratedDate)}</p>
                  </Link>
                ))}
              </div>
            )}
          </DashboardSectionCard>

          <DashboardSectionCard>
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Bell className="size-4 text-primary" /> Notifications</h2>
            {unreadNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">You're all caught up.</p>
            ) : (
              <div className="space-y-2">
                {unreadNotifications.slice(0, 3).map((n) => (
                  <div key={n.id} className="rounded-lg border p-3 text-sm">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </DashboardSectionCard>
        </div>
      </div>

      {packages && packages.length > 0 && (
        <DashboardSectionCard className="mt-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Available test packages</h2>
            <Link to="/patient/packages" className="text-sm font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {packages.slice(0, 3).map((p) => (
              <div key={p.id} className="rounded-lg border p-4">
                <p className="font-medium">{p.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.tests.length} tests</p>
                <p className="mt-2 font-semibold">{formatCurrency(p.discountedPrice)}</p>
              </div>
            ))}
          </div>
        </DashboardSectionCard>
      )}
    </div>
  )
}
