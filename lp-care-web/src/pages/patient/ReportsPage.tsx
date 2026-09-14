import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Eye, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { DashboardSectionCard } from "@/components/layouts/DashboardShell"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getMyBookings } from "@/services/api/bookingsApi"
import { viewPatientReport } from "@/services/api/labReportApi"
import { errorMessage } from "@/lib/apiClient"
import { formatDate } from "@/lib/utils"

export function ReportsPage() {
  const { data: bookings, isLoading } = useQuery({ queryKey: ["bookings", "mine"], queryFn: getMyBookings })
  const [viewingId, setViewingId] = useState<string | null>(null)

  const withReports = (bookings ?? []).filter((b) => b.hasReport)

  async function handleView(id: string) {
    setViewingId(id)
    try {
      await viewPatientReport(id)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setViewingId(null)
    }
  }

  return (
    <div>
      <PageHeader title="Laboratory Reports" description="View reports once they're ready." />

      {isLoading ? (
        <LoadingState rows={4} />
      ) : withReports.length === 0 ? (
        <EmptyState icon={FileText} title="No reports yet" description="Reports appear here once your sample has been processed." />
      ) : (
        <div className="space-y-3">
          {withReports.map((b) => (
            <DashboardSectionCard key={b.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </div>
                <div>
                  <p className="font-medium">{b.packageName ?? b.items.map((i) => i.testName).join(", ")}</p>
                  <p className="text-xs text-muted-foreground">
                    For {b.forFamilyMemberName ?? "Self"} · Sample collected {formatDate(b.collectionDate)}
                  </p>
                  {b.reportExpiresAt && (
                    <p className="text-xs text-amber-600">
                      Available until {formatDate(b.reportExpiresAt)} — download it before then, reports are removed from the server afterward.
                    </p>
                  )}
                </div>
              </div>
              <Button size="sm" variant="outline" disabled={viewingId === b.id} onClick={() => handleView(b.id)}>
                {viewingId === b.id ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
                View report
              </Button>
            </DashboardSectionCard>
          ))}
        </div>
      )}
    </div>
  )
}
