import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAllProducts } from "@/services/api/productsApi"
import { createCounterBill } from "@/services/api/ordersApi"
import { getCoupons } from "@/services/api/couponsApi"
import { getReferrals } from "@/services/api/referralsApi"
import { errorMessage } from "@/lib/apiClient"
import { formatCurrency } from "@/lib/utils"

interface WalkInMedicinePurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WalkInMedicinePurchaseDialog({ open, onOpenChange }: WalkInMedicinePurchaseDialogProps) {
  const queryClient = useQueryClient()
  const { data: products } = useQuery({ queryKey: ["owner-products"], queryFn: getAllProducts, enabled: open })
  const { data: coupons } = useQuery({ queryKey: ["coupons"], queryFn: getCoupons, enabled: open })
  const { data: referrals } = useQuery({ queryKey: ["referrals"], queryFn: getReferrals, enabled: open })

  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [couponId, setCouponId] = useState("")
  const [referralId, setReferralId] = useState("")

  const activeProducts = (products ?? []).filter((p) => p.active)
  const now = new Date()
  const activeCoupons = (coupons ?? []).filter((c) => c.active && new Date(c.expiresAt) >= now)
  const selectedCoupon = activeCoupons.find((c) => c.id === couponId)
  const activeReferrals = (referrals ?? []).filter((r) => r.active)

  const items = Object.entries(quantities).filter(([, qty]) => qty > 0)
  const subtotal = items.reduce((sum, [id, qty]) => {
    const product = activeProducts.find((p) => p.id === id)
    return sum + (product ? product.sellingPrice * qty : 0)
  }, 0)
  const discountPreview = selectedCoupon
    ? selectedCoupon.type === "FLAT"
      ? Math.min(selectedCoupon.value, subtotal)
      : Math.round((subtotal * selectedCoupon.value) / 100)
    : 0

  function reset() {
    setCustomerName("")
    setCustomerPhone("")
    setQuantities({})
    setCouponId("")
    setReferralId("")
  }

  function setQuantity(productId: string, qty: number) {
    setQuantities((q) => ({ ...q, [productId]: Math.max(0, qty) }))
  }

  const mutation = useMutation({
    mutationFn: () =>
      createCounterBill({
        items: items.map(([productId, quantity]) => ({ productId, quantity })),
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        discountType: selectedCoupon?.type,
        discountValue: selectedCoupon?.value,
        couponCode: selectedCoupon?.code,
        referralId: referralId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-orders"] })
      queryClient.invalidateQueries({ queryKey: ["owner-products"] })
      toast.success("Purchase recorded")
      reset()
      onOpenChange(false)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const canSubmit = items.length > 0

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); onOpenChange(next) }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Walk-in medicine purchase</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="wm-name">Customer name (optional)</Label>
              <Input id="wm-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wm-phone">Phone (optional)</Label>
              <Input id="wm-phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">
            {activeProducts.length === 0 && <p className="p-2 text-sm text-muted-foreground">No active products yet.</p>}
            {activeProducts.map((p) => {
              const qty = quantities[p.id] ?? 0
              return (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-md p-2 text-sm hover:bg-muted/50">
                  <div>
                    <p>{p.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(p.sellingPrice)} · {p.stockQuantity} in stock</p>
                  </div>
                  {qty === 0 ? (
                    <Button type="button" size="sm" variant="outline" disabled={p.stockQuantity <= 0} onClick={() => setQuantity(p.id, 1)}>
                      <Plus className="size-3.5" /> Add
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button type="button" size="icon-sm" variant="outline" onClick={() => setQuantity(p.id, qty - 1)}>
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-4 text-center">{qty}</span>
                      <Button type="button" size="icon-sm" variant="outline" disabled={qty >= p.stockQuantity} onClick={() => setQuantity(p.id, qty + 1)}>
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {subtotal > 0 && <p className="text-sm">Subtotal: <span className="font-medium">{formatCurrency(subtotal)}</span></p>}

          <div className="space-y-1.5">
            <Label>Coupon (optional)</Label>
            <Select value={couponId || "NONE"} onValueChange={(v) => setCouponId(v === "NONE" ? "" : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None</SelectItem>
                {activeCoupons.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} — {c.type === "FLAT" ? formatCurrency(c.value) : `${c.value}%`} off
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCoupon && (
              <p className="text-xs text-muted-foreground">Discount: -{formatCurrency(discountPreview)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Referred by (optional)</Label>
            <Select value={referralId || "NONE"} onValueChange={(v) => setReferralId(v === "NONE" ? "" : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None</SelectItem>
                {activeReferrals.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}{r.type === "DOCTOR" ? " (Doctor)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">Always paid in cash and invoiced immediately.</p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit || mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Record purchase
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
