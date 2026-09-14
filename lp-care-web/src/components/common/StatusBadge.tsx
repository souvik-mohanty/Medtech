import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Tone = "success" | "warning" | "destructive" | "info" | "neutral"

const TONE_CLASSES: Record<Tone, string> = {
  success: "border-transparent bg-success/10 text-success",
  warning: "border-transparent bg-warning/15 text-warning-foreground",
  destructive: "border-transparent bg-destructive/10 text-destructive",
  info: "border-transparent bg-primary/10 text-primary",
  neutral: "border-transparent bg-muted text-muted-foreground",
}

const STATUS_TONE: Record<string, Tone> = {
  // Bookings
  PENDING_PAYMENT: "warning",
  CONFIRMED: "info",
  SAMPLE_COLLECTION_SCHEDULED: "info",
  SAMPLE_COLLECTED: "info",
  PROCESSING: "info",
  REPORT_READY: "success",
  COMPLETED: "success",
  CANCELLED: "neutral",
  PAYMENT_FAILED: "destructive",
  // Collection
  SCHEDULED: "info",
  ASSIGNED: "info",
  // Payments
  CREATED: "neutral",
  PENDING: "warning",
  PARTIALLY_PAID: "warning",
  SUCCESS: "success",
  FAILED: "destructive",
  REFUNDED: "neutral",
  PARTIALLY_REFUNDED: "warning",
  // Reports
  READY: "success",
  // Patients
  ACTIVE: "success",
  INACTIVE: "neutral",
  // Orders (medicine/equipment)
  PAYMENT_PENDING: "warning",
  PAID: "success",
  DISPATCHED: "info",
  DELIVERED: "success",
}

function toLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ")
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONE[status] ?? "neutral"
  return (
    <Badge variant="outline" className={cn(TONE_CLASSES[tone], className)}>
      {toLabel(status)}
    </Badge>
  )
}
