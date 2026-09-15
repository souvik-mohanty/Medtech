import { useQuery } from "@tanstack/react-query"
import {
  Calendar,
  CreditCard,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Pill,
  Settings,
  ShoppingBag,
  Stethoscope,
  Users,
} from "lucide-react"
import { DashboardShell, type DashboardNavItem } from "@/components/layouts/DashboardShell"
import { getMyUnreadCount } from "@/services/api/notificationsApi"

const navItems: DashboardNavItem[] = [
  { to: "/patient", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/patient/profile", label: "My Profile", icon: Users },
  { to: "/patient/family", label: "Family Members", icon: Users },
  { to: "/patient/tests", label: "Book Test", icon: FlaskConical },
  { to: "/patient/bookings", label: "My Bookings", icon: Calendar },
  { to: "/patient/book-doctor", label: "Book a Doctor", icon: Stethoscope },
  { to: "/patient/appointments", label: "My Appointments", icon: Stethoscope },
  { to: "/patient/medicines", label: "Medicines & Equipment", icon: Pill },
  { to: "/patient/orders", label: "My Orders", icon: ShoppingBag },
  { to: "/patient/payments", label: "Payments", icon: CreditCard },
  { to: "/patient/reports", label: "Laboratory Reports", icon: FileText },
  { to: "/patient/settings", label: "Settings", icon: Settings },
]

export function PatientLayout() {
  const { data: unreadCount } = useQuery({ queryKey: ["notifications", "mine", "unread-count"], queryFn: getMyUnreadCount, refetchInterval: 30000 })
  return (
    <DashboardShell
      navItems={navItems}
      portalLabel="Patient Portal"
      settingsPath="/patient/settings"
      notificationsPath="/patient/notifications"
      unreadNotifications={unreadCount ?? 0}
    />
  )
}
