import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Banknote, Loader2, MapPin, Minus, PartyPopper, Plus, Smartphone, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PageHeader } from "@/components/common/PageHeader"
import { DashboardSectionCard } from "@/components/layouts/DashboardShell"
import { EmptyState } from "@/components/common/EmptyState"
import { AddAddressDialog } from "@/components/patient/AddAddressDialog"
import { createOrder } from "@/services/api/ordersApi"
import { getFranchiseId, getPaymentGatewayInfo } from "@/services/api/franchiseApi"
import { getCurrentPatient } from "@/services/api/patientsApi"
import { useMedicineCartStore } from "@/app/store/medicineCartStore"
import { errorMessage } from "@/lib/apiClient"
import { cn, formatCurrency } from "@/lib/utils"
import type { Order, OrderPaymentMode } from "@/types"

export function MedicineCheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { items, setQuantity, removeItem, reset } = useMedicineCartStore()
  const { data: gatewayInfo } = useQuery({ queryKey: ["franchise-payment-gateway"], queryFn: getPaymentGatewayInfo })
  const hasGateway = !!gatewayInfo?.hasActivePaymentGateway
  const { data: patient } = useQuery({ queryKey: ["currentPatient"], queryFn: getCurrentPatient })

  const [paymentMode, setPaymentMode] = useState<OrderPaymentMode>("CASH")
  const [mobileNumber, setMobileNumber] = useState("")
  const [addressId, setAddressId] = useState("")
  const [addAddressOpen, setAddAddressOpen] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null)

  const subtotal = items.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0)
  const gst = items.reduce((sum, i) => sum + (i.product.sellingPrice * i.quantity * i.product.gstPercentage) / 100, 0)
  const total = subtotal + gst

  const orderMutation = useMutation({
    mutationFn: async () =>
      createOrder({
        franchiseId: await getFranchiseId(),
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        paymentMode,
        mobileNumber,
        addressId,
      }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      setConfirmedOrder(order)
      reset()
      toast.success("Order placed!")
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  if (confirmedOrder) {
    return (
      <div>
        <PageHeader title="Checkout" />
        <DashboardSectionCard className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
            <PartyPopper className="size-7" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Order placed</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Order <span className="font-medium text-foreground">#{confirmedOrder.id}</span> has been placed.
            {confirmedOrder.status === "PAYMENT_PENDING" && " Please keep the payment ready to pay in cash on delivery/pickup."}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" onClick={() => navigate("/patient")}>Go to Dashboard</Button>
            <Button onClick={() => navigate("/patient/orders")}>View My Orders</Button>
          </div>
        </DashboardSectionCard>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title="Checkout" />
        <EmptyState
          title="Your cart is empty"
          description="Browse medicines and equipment and add them to your cart first."
          actionLabel="Browse Medicines"
          onAction={() => navigate("/patient/medicines")}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Checkout" description="Review your order and choose how you'd like to pay." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Your items</h2>
          <div className="divide-y rounded-lg border">
            {items.map((i) => (
              <div key={i.product.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div>
                  <p className="font-medium">{i.product.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(i.product.sellingPrice)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon-sm" variant="outline" onClick={() => setQuantity(i.product.id, i.quantity - 1)}>
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="w-4 text-center">{i.quantity}</span>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    disabled={i.quantity >= i.product.stockQuantity}
                    onClick={() => setQuantity(i.product.id, i.quantity + 1)}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => removeItem(i.product.id)}>
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-6 mb-3 font-semibold">Delivery details</h2>
          <div className="space-y-1.5">
            <Label htmlFor="checkout-mobile">Mobile number</Label>
            <Input id="checkout-mobile" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Delivery address</p>
              <Button size="sm" variant="outline" type="button" onClick={() => setAddAddressOpen(true)}>
                <Plus className="size-4" /> Add address
              </Button>
            </div>
            {patient && patient.addresses.length > 0 ? (
              <div className="space-y-2">
                {patient.addresses.map((addr) => (
                  <button
                    type="button"
                    key={addr.id}
                    onClick={() => setAddressId(addr.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                      addressId === addr.id ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                    )}
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{addr.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} – {addr.pincode}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>No saved addresses yet. Add one above to continue.</AlertDescription>
              </Alert>
            )}
          </div>

          <h2 className="mt-6 mb-3 font-semibold">Payment method</h2>
          {!hasGateway && (
            <Alert className="mb-3">
              <AlertDescription>
                Online payment isn't set up for this lab yet — you can still place your order now and pay in cash on delivery/pickup.
              </AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setPaymentMode("CASH")}
              className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors ${paymentMode === "CASH" ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/50"}`}
            >
              <Banknote className="size-5" />
              Cash on delivery
            </button>
            <button
              type="button"
              disabled={!hasGateway}
              onClick={() => setPaymentMode("ONLINE")}
              className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${hasGateway && paymentMode === "ONLINE" ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/50"}`}
            >
              <Smartphone className="size-5" />
              Pay online
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {paymentMode === "CASH"
              ? "Pay when your order is delivered or picked up — no online charge is made."
              : "This is a mock payment for demo purposes — no real transaction is made."}
          </p>

          <Button
            className="mt-6 w-full"
            disabled={orderMutation.isPending || !mobileNumber.trim() || !addressId}
            onClick={() => orderMutation.mutate()}
          >
            {orderMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {paymentMode === "CASH" ? `Place Order · ${formatCurrency(total)}` : `Pay ${formatCurrency(total)}`}
          </Button>
        </DashboardSectionCard>

        <DashboardSectionCard className="h-fit">
          <h2 className="mb-4 font-semibold">Order summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST</span>
              <span>{formatCurrency(gst)}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t pt-3 text-base font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </DashboardSectionCard>
      </div>

      <AddAddressDialog
        open={addAddressOpen}
        onOpenChange={setAddAddressOpen}
        onAdded={(addresses) => {
          const newest = addresses[addresses.length - 1]
          if (newest) setAddressId(newest.id)
        }}
      />
    </div>
  )
}
