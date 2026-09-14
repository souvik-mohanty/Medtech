import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/common/PageHeader"
import { CardGridSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { CartSummaryBar } from "@/components/patient/CartSummaryBar"
import { getTests, type TestFilters } from "@/services/api/testsApi"
import { useBookingCartStore } from "@/app/store/bookingCartStore"
import { formatCurrency } from "@/lib/utils"
import type { TestCategory } from "@/types"

const CATEGORIES: { value: TestCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "All categories" },
  { value: "BLOOD", label: "Blood Tests" },
  { value: "URINE", label: "Urine Tests" },
  { value: "HORMONE", label: "Hormone Tests" },
  { value: "DIABETES", label: "Diabetes Tests" },
  { value: "LIPID_PROFILE", label: "Lipid Profile" },
  { value: "LIVER_FUNCTION", label: "Liver Function Tests" },
  { value: "KIDNEY_FUNCTION", label: "Kidney Function Tests" },
  { value: "THYROID", label: "Thyroid Tests" },
  { value: "VITAMIN", label: "Vitamin Tests" },
  { value: "ROUTINE_HEALTH", label: "Routine Health Packages" },
]

const PAGE_SIZE = 8

export function PatientTestsPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<TestCategory | "ALL">("ALL")
  const [sort, setSort] = useState<NonNullable<TestFilters["sort"]>>("NAME_ASC")
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tests", search, category, sort],
    queryFn: () => getTests({ search, category, sort }),
  })

  const { selectedTests, addTest, removeTest } = useBookingCartStore()
  const selectedIds = useMemo(() => new Set(selectedTests.map((t) => t.id)), [selectedTests])

  const totalPages = Math.max(1, Math.ceil((data?.length ?? 0) / PAGE_SIZE))
  const pageItems = useMemo(() => (data ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [data, page])

  function updateFilter<T>(setter: (v: T) => void, value: T) {
    setter(value)
    setPage(1)
  }

  return (
    <div className="pb-20">
      <PageHeader title="Browse Tests" description="Search or filter by category, then add tests to your booking." />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by test name or code…"
            className="pl-9"
            value={search}
            onChange={(e) => updateFilter(setSearch, e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={(v) => updateFilter(setCategory, v as TestCategory | "ALL")}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => updateFilter(setSort, v as typeof sort)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NAME_ASC">Name (A–Z)</SelectItem>
            <SelectItem value="PRICE_ASC">Price: Low to High</SelectItem>
            <SelectItem value="PRICE_DESC">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <CardGridSkeleton count={8} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : pageItems.length === 0 ? (
          <EmptyState title="No tests found" description="Try a different search term or category." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pageItems.map((test) => {
                const selected = selectedIds.has(test.id)
                return (
                  <Card key={test.id} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary" className="text-xs">{test.category.replace(/_/g, " ")}</Badge>
                        {test.prescriptionRequired && (
                          <Badge variant="outline" className="text-xs text-warning-foreground">Rx required</Badge>
                        )}
                      </div>
                      <CardTitle className="text-base">{test.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">Code: {test.code}</p>
                    </CardHeader>
                    <CardContent className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-lg font-bold">{formatCurrency(test.price)}</span>
                      {selected ? (
                        <Button size="sm" variant="outline" onClick={() => removeTest(test.id)}>
                          <Check className="size-4" /> Added
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => addTest(test)}>
                          <Plus className="size-4" /> Add
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="px-2 text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <CartSummaryBar />
    </div>
  )
}
