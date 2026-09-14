import { useQuery } from "@tanstack/react-query"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/common/PageHeader"
import { CardGridSkeleton } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { CartSummaryBar } from "@/components/patient/CartSummaryBar"
import { getPackages } from "@/services/api/testsApi"
import { useBookingCartStore } from "@/app/store/bookingCartStore"
import { formatCurrency } from "@/lib/utils"

export function PatientPackagesPage() {
  const { data: packages, isLoading, isError, refetch } = useQuery({ queryKey: ["packages"], queryFn: getPackages })
  const { selectedPackage, selectPackage } = useBookingCartStore()

  return (
    <div className="pb-20">
      <PageHeader title="Test Packages" description="Bundled tests at a discounted price for common health goals." />

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(packages ?? []).map((pkg) => {
            const included = pkg.tests
            const savings = pkg.totalPrice - pkg.discountedPrice
            const selected = selectedPackage?.id === pkg.id
            return (
              <Card key={pkg.id} className={selected ? "flex flex-col ring-2 ring-primary" : "flex flex-col"}>
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
                    <Button
                      className="mt-3 w-full"
                      variant={selected ? "outline" : "default"}
                      onClick={() => (selected ? selectPackage(null) : selectPackage(pkg))}
                    >
                      {selected ? "Selected — Remove" : "Select Package"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CartSummaryBar />
    </div>
  )
}
