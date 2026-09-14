import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Minus, Pill, Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/common/PageHeader"
import { CardGridSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { MedicineCartBar } from "@/components/patient/MedicineCartBar"
import { getProducts } from "@/services/api/productsApi"
import { getFranchiseId } from "@/services/api/franchiseApi"
import { useMedicineCartStore } from "@/app/store/medicineCartStore"
import { formatCurrency } from "@/lib/utils"

export function PatientMedicinesPage() {
  const [search, setSearch] = useState("")
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["products"],
    queryFn: async () => getProducts(await getFranchiseId()),
  })

  const { items, addItem, setQuantity } = useMedicineCartStore()
  const quantityById = useMemo(() => new Map(items.map((i) => [i.product.id, i.quantity])), [items])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return data ?? []
    return (data ?? []).filter((p) => p.name.toLowerCase().includes(term))
  }, [data, search])

  return (
    <div className="pb-20">
      <PageHeader title="Medicines & Equipment" description="Order medicines and equipment for home delivery or pickup." />

      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search medicines…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <CardGridSkeleton count={8} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Pill} title="No products found" description="This lab hasn't listed any medicines or equipment yet." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((product) => {
              const qty = quantityById.get(product.id) ?? 0
              const outOfStock = product.stockQuantity <= 0
              return (
                <Card key={product.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      {product.unit && <Badge variant="secondary" className="text-xs">{product.unit}</Badge>}
                      {product.prescriptionRequired && (
                        <Badge variant="outline" className="text-xs text-warning-foreground">Rx required</Badge>
                      )}
                    </div>
                    <CardTitle className="text-base">{product.name}</CardTitle>
                    {outOfStock && <p className="text-xs text-destructive">Out of stock</p>}
                  </CardHeader>
                  <CardContent className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-lg font-bold">{formatCurrency(product.sellingPrice)}</span>
                    {qty === 0 ? (
                      <Button size="sm" disabled={outOfStock} onClick={() => addItem(product)}>
                        <Plus className="size-4" /> Add
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button size="icon-sm" variant="outline" onClick={() => setQuantity(product.id, qty - 1)}>
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-4 text-center text-sm font-medium">{qty}</span>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          disabled={qty >= product.stockQuantity}
                          onClick={() => setQuantity(product.id, qty + 1)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <MedicineCartBar />
    </div>
  )
}
