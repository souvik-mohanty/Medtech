import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Check, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/common/ErrorState"
import { getPackageById } from "@/services/api/testsApi"
import { formatCurrency } from "@/lib/utils"

export function PackageDetailPage() {
  const { packageId } = useParams<{ packageId: string }>()
  const { data: pkg, isLoading, isError, refetch } = useQuery({
    queryKey: ["package", packageId],
    queryFn: () => getPackageById(packageId!),
    enabled: !!packageId,
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    )
  }

  if (isError || !pkg) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState title="Package not found" onRetry={() => refetch()} />
      </div>
    )
  }

  const included = pkg.tests

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">{pkg.name}</h1>
      <p className="mt-3 text-muted-foreground">{pkg.description}</p>

      <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_320px]">
        <div>
          <h2 className="font-semibold">Included tests ({included.length})</h2>
          <div className="mt-3 divide-y rounded-xl border">
            {included.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Check className="size-4 text-secondary" />
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.sampleType}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{formatCurrency(t.price)}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border bg-muted/30 p-5">
            <p className="text-sm font-medium">Preparation instructions</p>
            <p className="mt-1 text-sm text-muted-foreground">{pkg.preparationInstructions}</p>
          </div>
        </div>

        <Card className="h-fit">
          <CardContent className="pt-6">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{formatCurrency(pkg.discountedPrice)}</span>
              <span className="text-sm text-muted-foreground line-through">{formatCurrency(pkg.totalPrice)}</span>
            </div>
            <p className="mt-1 text-xs text-secondary">
              You save {formatCurrency(pkg.totalPrice - pkg.discountedPrice)}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" /> Report in {pkg.reportTurnaroundHours} hours
            </div>
            <Button size="lg" className="mt-5 w-full" asChild>
              <Link to="/login">Book this package</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
