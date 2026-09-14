import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CardGridSkeleton } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { getPackages } from "@/services/api/testsApi"
import { formatCurrency } from "@/lib/utils"

export function PackagesPage() {
  const { data: packages, isLoading, isError, refetch } = useQuery({ queryKey: ["packages"], queryFn: getPackages })

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Packages</h1>
        <p className="mt-2 text-muted-foreground">Bundled tests at a discounted price for common health goals.</p>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <CardGridSkeleton count={6} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(packages ?? []).map((pkg) => {
              const included = pkg.tests
              const savings = pkg.totalPrice - pkg.discountedPrice
              return (
                <Card key={pkg.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{pkg.description}</p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <ul className="space-y-1.5 text-sm">
                      {included.slice(0, 4).map((t) => (
                        <li key={t.id} className="flex items-center gap-2">
                          <Check className="size-3.5 shrink-0 text-secondary" />
                          <span className="text-muted-foreground">{t.name}</span>
                        </li>
                      ))}
                      {included.length > 4 && (
                        <li className="text-xs text-muted-foreground">+ {included.length - 4} more tests</li>
                      )}
                    </ul>

                    <div className="mt-auto pt-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold">{formatCurrency(pkg.discountedPrice)}</span>
                        <span className="text-sm text-muted-foreground line-through">{formatCurrency(pkg.totalPrice)}</span>
                        <span className="text-xs font-medium text-secondary">Save {formatCurrency(savings)}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" className="flex-1" asChild>
                          <Link to={`/packages/${pkg.id}`}>Details</Link>
                        </Button>
                        <Button className="flex-1" asChild>
                          <Link to="/login">Book</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
