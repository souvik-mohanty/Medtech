import { useNavigate } from "react-router-dom"
import { ShoppingCart, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBookingCartStore } from "@/app/store/bookingCartStore"
import { formatCurrency } from "@/lib/utils"

/** Floating summary shown on the patient Tests/Packages pages once the cart has something in it. */
export function CartSummaryBar() {
  const navigate = useNavigate()
  const { selectedTests, selectedPackage, removeTest, selectPackage } = useBookingCartStore()

  const count = selectedPackage ? 1 : selectedTests.length
  const total = selectedPackage ? selectedPackage.discountedPrice : selectedTests.reduce((sum, t) => sum + t.price, 0)

  if (count === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShoppingCart className="size-4.5" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {selectedPackage ? selectedPackage.name : `${count} ${count === 1 ? "test" : "tests"} selected`}
            </p>
            <p className="text-xs text-muted-foreground">{formatCurrency(total)}</p>
          </div>
          {selectedPackage ? (
            <Button size="icon-sm" variant="ghost" onClick={() => selectPackage(null)}>
              <X className="size-3.5" />
            </Button>
          ) : (
            selectedTests.length > 0 && (
              <div className="hidden gap-1 sm:flex">
                {selectedTests.slice(0, 3).map((t) => (
                  <Button key={t.id} size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => removeTest(t.id)}>
                    {t.name.length > 18 ? `${t.name.slice(0, 18)}…` : t.name} <X className="size-3" />
                  </Button>
                ))}
                {selectedTests.length > 3 && (
                  <span className="self-center text-xs text-muted-foreground">+{selectedTests.length - 3} more</span>
                )}
              </div>
            )
          )}
        </div>
        <Button onClick={() => navigate("/patient/book")}>Proceed to Book</Button>
      </div>
    </div>
  )
}
