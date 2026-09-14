import { useQuery } from "@tanstack/react-query"
import {
  Bell,
  CalendarCheck,
  CreditCard,
  FileText,
  PackageCheck,
  Receipt,
  RotateCcw,
  XCircle,
} from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { DashboardSectionCard } from "@/components/layouts/DashboardShell"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getOwnerNotifications } from "@/services/api/notificationsApi"
import { formatDateTime } from "@/lib/utils"
import type { NotificationType } from "@/types"

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  BOOKING_CONFIRMATION: PackageCheck,
  PAYMENT_SUCCESS: CreditCard,
  PAYMENT_FAILURE: XCircle,
  COLLECTION_REMINDER: CalendarCheck,
  COLLECTION_UPDATE: CalendarCheck,
  REPORT_READY: FileText,
  INVOICE_GENERATED: Receipt,
  REFUND_UPDATE: RotateCcw,
}

export function OwnerNotificationsPage() {
  const { data: notifications, isLoading } = useQuery({ queryKey: ["notifications", "owner"], queryFn: getOwnerNotifications })

  return (
    <div>
      <PageHeader title="Notifications" description="New bookings, orders, and payments for your laboratory." />

      {isLoading ? (
        <LoadingState rows={5} />
      ) : !notifications || notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications sent yet" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = TYPE_ICON[n.type]
            return (
              <DashboardSectionCard key={n.id} className="flex items-start gap-3 p-4">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                </div>
              </DashboardSectionCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
