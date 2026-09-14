import { useQuery } from "@tanstack/react-query"
import {
  BarChart3,
  Bell,
  Calendar,
  Clock,
  CreditCard,
  FlaskConical,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Stethoscope,
  Store,
  Tag,
  User,
  UserPlus,
  Users,
} from "lucide-react"
import { DashboardShell, type DashboardNavItem } from "@/components/layouts/DashboardShell"
import { getOwnerUnreadCount } from "@/services/api/notificationsApi"

const navItems: DashboardNavItem[] = [
  { to: "/owner", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/owner/patients", label: "Patients", icon: Users },
  { to: "/owner/tests", label: "Pathology Tests", icon: FlaskConical },
  { to: "/owner/packages", label: "Test Packages", icon: Package },
  { to: "/owner/bookings", label: "Bookings", icon: Calendar },
  { to: "/owner/walk-in", label: "Walk-in Billing", icon: Store },
  { to: "/owner/pending-orders", label: "Pending Online Orders", icon: Clock },
  { to: "/owner/inventory", label: "Inventory", icon: Package },
  { to: "/owner/orders", label: "Medicine Orders", icon: ShoppingBag },
  { to: "/owner/payments", label: "Payments", icon: CreditCard },
  { to: "/owner/invoices", label: "Invoices", icon: Receipt },
  { to: "/owner/coupons", label: "Coupons", icon: Tag },
  { to: "/owner/referrals", label: "Referral Management", icon: UserPlus },
  { to: "/owner/doctors", label: "Doctor Appointments", icon: Stethoscope },
  { to: "/owner/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/owner/notifications", label: "Notifications", icon: Bell },
  { to: "/owner/settings", label: "Laboratory Settings", icon: Settings },
  { to: "/owner/profile", label: "Profile", icon: User },
]

export function OwnerLayout() {
  const { data: unreadCount } = useQuery({ queryKey: ["notifications", "owner", "unread-count"], queryFn: getOwnerUnreadCount, refetchInterval: 30000 })
  return <DashboardShell navItems={navItems} portalLabel="Owner Dashboard" settingsPath="/owner/profile" unreadNotifications={unreadCount ?? 0} />
}
