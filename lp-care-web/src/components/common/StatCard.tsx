import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  tone?: "default" | "success" | "warning" | "destructive"
}

const TONE_CLASSES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
}

export function StatCard({ label, value, icon: Icon, tone = "default" }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex size-9 items-center justify-center rounded-lg", TONE_CLASSES[tone])}>
          <Icon className="size-4.5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold leading-tight">{value}</p>
        </div>
      </div>
    </div>
  )
}
