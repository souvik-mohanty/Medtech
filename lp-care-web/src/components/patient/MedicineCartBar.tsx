import { useNavigate } from "react-router-dom"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMedicineCartStore } from "@/app/store/medicineCartStore"
import { formatCurrency } from "@/lib/utils"

/** Floating summary shown on the patient Medicines page once the cart has something in it. */
export function MedicineCartBar() {
  const navigate = useNavigate()
  const { items } = useMedicineCartStore()

  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const total = items.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0)

  if (count === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShoppingCart className="size-4.5" />
          </div>
          <div>
            <p className="text-sm font-medium">{count} {count === 1 ? "item" : "items"} in cart</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(total)}</p>
          </div>
        </div>
        <Button onClick={() => navigate("/patient/medicines/checkout")}>Proceed to Checkout</Button>
      </div>
    </div>
  )
}
