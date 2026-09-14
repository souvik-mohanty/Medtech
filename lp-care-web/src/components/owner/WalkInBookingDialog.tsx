import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAllPackages, getAllTests } from "@/services/api/testsApi"
import { createWalkInBooking } from "@/services/api/bookingsApi"
import { getReferrals } from "@/services/api/referralsApi"
import { getCoupons } from "@/services/api/couponsApi"
import { errorMessage } from "@/lib/apiClient"
import { formatCurrency } from "@/lib/utils"

type PaymentChoice = "PENDING" | "PARTIAL" | "FULL"

interface WalkInBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WalkInBookingDialog({ open, onOpenChange }: WalkInBookingDialogProps) {
  const queryClient = useQueryClient()
  const { data: tests } = useQuery({ queryKey: ["owner-tests"], queryFn: getAllTests, enabled: open })
  const { data: packages } = useQuery({ queryKey: ["owner-packages"], queryFn: getAllPackages, enabled: open })
  const { data: referrals } = useQuery({ queryKey: ["referrals"], queryFn: getReferrals, enabled: open })
  const { data: coupons } = useQuery({ queryKey: ["coupons"], queryFn: getCoupons, enabled: open })

  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [patientEmail, setPatientEmail] = useState("")
  const [mode, setMode] = useState<"TESTS" | "PACKAGE">("TESTS")
  const [testIds, setTestIds] = useState<string[]>([])
  const [packageId, setPackageId] = useState("")
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("FULL")
  const [partialAmount, setPartialAmount] = useState("")
  const [referralId, setReferralId] = useState<string>("")
  const [couponId, setCouponId] = useState<string>("")

  const activeTests = (tests ?? []).filter((t) => t.active)
  const activePackages = (packages ?? []).filter((p) => p.active)
  const activeReferrals = (referrals ?? []).filter((r) => r.active)
  const now = new Date()
  const activeCoupons = (coupons ?? []).filter((c) => c.active && new Date(c.expiresAt) >= now)
  const selectedCoupon = activeCoupons.find((c) => c.id === couponId)

  const estimatedSubtotal = useMemo(() => {
    if (mode === "PACKAGE") return activePackages.find((p) => p.id === packageId)?.discountedPrice ?? 0
    return activeTests.filter((t) => testIds.includes(t.id)).reduce((sum, t) => sum + t.price, 0)
  }, [mode, packageId, testIds, activeTests, activePackages])
  const estimatedTotal = Math.round(estimatedSubtotal * 1.05)

  function reset() {
    setCustomerName("")
    setCustomerPhone("")
    setPatientEmail("")
    setMode("TESTS")
    setTestIds([])
    setPackageId("")
    setPaymentChoice("FULL")
    setPartialAmount("")
    setReferralId("")
    setCouponId("")
  }

  function toggleTest(id: string) {
    setTestIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  const mutation = useMutation({
    mutationFn: () =>
      createWalkInBooking({
        customerName,
        customerPhone: customerPhone || undefined,
        patientEmail: patientEmail || undefined,
        testIds: mode === "TESTS" ? testIds : undefined,
        packageId: mode === "PACKAGE" ? packageId : undefined,
        // "Fully paid" sends a deliberately huge sentinel rather than our own
        // estimatedTotal — the backend computes the real total with precise
        // BigDecimal/GST math and caps amountPaid to it, so this can never
        // land a paisa short of "fully paid" the way our rounded client-side
        // estimate could (that mismatch used to show up as PARTIALLY_PAID).
        amountPaid:
          paymentChoice === "FULL" ? Number.MAX_SAFE_INTEGER : paymentChoice === "PARTIAL" ? Number(partialAmount) || 0 : 0,
        referralId: referralId || undefined,
        couponCode: selectedCoupon?.code,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["owner-collection"] })
      toast.success("Walk-in booking added")
      reset()
      onOpenChange(false)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const canSubmit =
    customerName.trim().length > 0 &&
    (mode === "TESTS" ? testIds.length > 0 : packageId.length > 0) &&
    (paymentChoice !== "PARTIAL" || (Number(partialAmount) > 0 && Number(partialAmount) < estimatedTotal))

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); onOpenChange(next) }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Walk-in booking</DialogTitle>
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
              <Label htmlFor="wi-name">Customer name</Label>
              <Input id="wi-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wi-phone">Phone (optional)</Label>
              <Input id="wi-phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wi-email">Email (optional)</Label>
            <Input
              id="wi-email"
              type="email"
              placeholder="patient@example.com"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              If given, this booking and its report will show up once the patient logs in with this email.
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="button" size="sm" variant={mode === "TESTS" ? "default" : "outline"} onClick={() => setMode("TESTS")}>
              Individual tests
            </Button>
            <Button type="button" size="sm" variant={mode === "PACKAGE" ? "default" : "outline"} onClick={() => setMode("PACKAGE")}>
              Package
            </Button>
          </div>

          {mode === "TESTS" ? (
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border p-2">
              {activeTests.length === 0 && <p className="p-2 text-sm text-muted-foreground">No active tests yet.</p>}
              {activeTests.map((t) => (
                <label key={t.id} className="flex items-center justify-between gap-2 rounded-md p-2 text-sm hover:bg-muted/50">
                  <span className="flex items-center gap-2">
                    <Checkbox checked={testIds.includes(t.id)} onCheckedChange={() => toggleTest(t.id)} />
                    {t.name}
                  </span>
                  <span className="text-muted-foreground">{formatCurrency(t.price)}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border p-2">
              {activePackages.length === 0 && <p className="p-2 text-sm text-muted-foreground">No active packages yet.</p>}
              {activePackages.map((p) => (
                <label key={p.id} className="flex items-center justify-between gap-2 rounded-md p-2 text-sm hover:bg-muted/50">
                  <span className="flex items-center gap-2">
                    <Checkbox checked={packageId === p.id} onCheckedChange={() => setPackageId(p.id)} />
                    {p.name}
                  </span>
                  <span className="text-muted-foreground">{formatCurrency(p.discountedPrice)}</span>
                </label>
              ))}
            </div>
          )}

          {estimatedTotal > 0 && (
            <p className="text-sm">
              Estimated total (incl. GST): <span className="font-medium">{formatCurrency(estimatedTotal)}</span>
            </p>
          )}

          <div className="space-y-1.5">
            <Label>Payment</Label>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={paymentChoice === "FULL" ? "default" : "outline"} onClick={() => setPaymentChoice("FULL")}>
                Fully paid
              </Button>
              <Button type="button" size="sm" variant={paymentChoice === "PARTIAL" ? "default" : "outline"} onClick={() => setPaymentChoice("PARTIAL")}>
                Partially paid
              </Button>
              <Button type="button" size="sm" variant={paymentChoice === "PENDING" ? "default" : "outline"} onClick={() => setPaymentChoice("PENDING")}>
                Payment pending
              </Button>
            </div>
            {paymentChoice === "PARTIAL" && (
              <Input
                type="number"
                min={1}
                max={estimatedTotal - 1}
                placeholder="Amount received now"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
                className="mt-2 max-w-xs"
              />
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
              <p className="text-xs text-muted-foreground">Recorded on the booking — not yet deducted from the total automatically.</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Always a lab visit, marked sample-collected immediately.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit || mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Add booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
