import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Clock, FileWarning, TestTube2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/common/ErrorState"
import { getTestById } from "@/services/api/testsApi"
import { formatCurrency } from "@/lib/utils"

export function TestDetailPage() {
  const { testId } = useParams<{ testId: string }>()
  const { data: test, isLoading, isError, refetch } = useQuery({
    queryKey: ["test", testId],
    queryFn: () => getTestById(testId!),
    enabled: !!testId,
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    )
  }

  if (isError || !test) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState title="Test not found" description="This test may have been removed." onRetry={() => refetch()} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge variant="secondary" className="mb-3">{test.category.replace(/_/g, " ")}</Badge>
      <h1 className="text-3xl font-bold tracking-tight">{test.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Test code: {test.code}</p>
      <p className="mt-5 text-muted-foreground">{test.description}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-start gap-3 pt-6">
            <TestTube2 className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Sample type</p>
              <p className="text-sm text-muted-foreground">{test.sampleType}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 pt-6">
            <Clock className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Report turnaround</p>
              <p className="text-sm text-muted-foreground">{test.reportTurnaroundHours} hours</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 pt-6">
            <FileWarning className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Prescription</p>
              <p className="text-sm text-muted-foreground">{test.prescriptionRequired ? "Required" : "Not required"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 rounded-xl border bg-muted/30 p-5">
        <p className="text-sm font-medium">Preparation instructions</p>
        <p className="mt-1 text-sm text-muted-foreground">{test.preparationInstructions}</p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5">
        <div>
          <p className="text-sm text-muted-foreground">Price</p>
          <p className="text-2xl font-bold">{formatCurrency(test.price)}</p>
        </div>
        <Button size="lg" asChild>
          <Link to="/login">Book Now</Link>
        </Button>
      </div>
    </div>
  )
}
