import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Bell,
  CalendarCheck,
  CheckCheck,
  CreditCard,
  FileText,
  PackageCheck,
  Receipt,
  RotateCcw,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/api/notificationsApi"
import { cn, formatDateTime } from "@/lib/utils"
import type { AppNotification, NotificationType } from "@/types"

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

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data: notifications, isLoading } = useQuery({ queryKey: ["notifications", "mine"], queryFn: getMyNotifications })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const unreadCount = (notifications ?? []).filter((n: AppNotification) => !n.read).length

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Booking, payment, collection, and report updates."
        actions={
          unreadCount > 0 ? (
            <Button size="sm" variant="outline" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending}>
              <CheckCheck className="size-3.5" /> Mark all as read
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingState rows={5} />
      ) : !notifications || notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="You're all caught up." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = TYPE_ICON[n.type]
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => !n.read && markReadMutation.mutate(n.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                  n.read ? "bg-card" : "border-primary/30 bg-primary/5 hover:bg-primary/10",
                )}
              >
                <div className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg", n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
