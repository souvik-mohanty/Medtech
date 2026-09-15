import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Banknote,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Landmark,
  Loader2,
  MapPin,
  PartyPopper,
  Plus,
  Smartphone,
  Tag,
  Truck,
  User,
  Wallet,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PageHeader } from "@/components/common/PageHeader"
import { DashboardSectionCard } from "@/components/layouts/DashboardShell"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getCurrentPatient, updatePatientProfile } from "@/services/api/patientsApi"
import { validateCoupon } from "@/services/api/couponsApi"
import { createBooking } from "@/services/api/bookingsApi"
import { getFranchiseId } from "@/services/api/franchiseApi"
import { getPaymentGatewayConfig } from "@/services/api/paymentGatewayApi"
import { useBookingCartStore } from "@/app/store/bookingCartStore"
import { AddFamilyMemberDialog } from "@/components/patient/AddFamilyMemberDialog"
import { AddAddressDialog } from "@/components/patient/AddAddressDialog"
import { errorMessage } from "@/lib/apiClient"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import type { Booking, Coupon } from "@/types"

type PaymentMethod = "UPI" | "CARD" | "NETBANKING" | "WALLET" | "CASH"

const STEPS = ["Review", "For whom", "Collection", "Schedule", "Payment"]
const COLLECTION_SLOTS = ["07:00 AM – 09:00 AM", "08:00 AM – 10:00 AM", "10:00 AM – 12:00 PM", "02:00 PM – 04:00 PM", "04:00 PM – 06:00 PM"]
const HOME_COLLECTION_CHARGE = 99
const ONLINE_PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Smartphone }[] = [
  { value: "UPI", label: "UPI", icon: Smartphone },
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "NETBANKING", label: "Net Banking", icon: Landmark },
  { value: "WALLET", label: "Wallet", icon: Wallet },
]
const CASH_PAYMENT_METHOD = { value: "CASH" as const, label: "Pay at Lab", icon: Banknote }

function nextDays(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return d.toISOString().slice(0, 10)
  })
}

export function BookTestPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const cart = useBookingCartStore()
  const { data: patient, isLoading: loadingPatient } = useQuery({ queryKey: ["currentPatient"], queryFn: getCurrentPatient })
  const { data: gatewayConfig } = useQuery({ queryKey: ["payment-gateway"], queryFn: getPaymentGatewayConfig })
  const hasGateway = !!gatewayConfig?.active

  const [step, setStep] = useState(0)
  const [couponInput, setCouponInput] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI")
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)
  const [addFamilyMemberOpen, setAddFamilyMemberOpen] = useState(false)
  const [addAddressOpen, setAddAddressOpen] = useState(false)
  const [phoneInput, setPhoneInput] = useState("")
  const selectedMethod: PaymentMethod = hasGateway ? paymentMethod : "CASH"

  const savePhoneMutation = useMutation({
    mutationFn: () => updatePatientProfile({ phone: phoneInput }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["currentPatient"], updated)
      toast.success("Phone number saved")
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const items = useMemo(() => {
    if (cart.selectedPackage) {
      return cart.selectedPackage.tests.map((t) => ({ testId: t.id, testName: t.name, price: t.price }))
    }
    return cart.selectedTests.map((t) => ({ testId: t.id, testName: t.name, price: t.price }))
  }, [cart.selectedPackage, cart.selectedTests])

  // Each test's own GST rate (0 by default) — no more flat 5% assumed on everything.
  const gstableTests = cart.selectedPackage ? cart.selectedPackage.tests : cart.selectedTests

  const rawSubtotal = items.reduce((sum, i) => sum + i.price, 0)
  const packageDiscount = cart.selectedPackage ? cart.selectedPackage.totalPrice - cart.selectedPackage.discountedPrice : 0
  const postPackageAmount = Math.max(0, rawSubtotal - packageDiscount)
  const couponDiscount = appliedCoupon
    ? Math.min(
        postPackageAmount,
        appliedCoupon.type === "FLAT" ? appliedCoupon.value : Math.round((postPackageAmount * appliedCoupon.value) / 100),
      )
    : 0
  const totalDiscount = packageDiscount + couponDiscount
  const collectionCharge = cart.collectionMethod === "HOME_COLLECTION" ? HOME_COLLECTION_CHARGE : 0
  const taxable = Math.max(0, rawSubtotal - totalDiscount) + collectionCharge
  const discountRatio = rawSubtotal > 0 ? Math.max(0, rawSubtotal - totalDiscount) / rawSubtotal : 1
  const gst = Math.round(gstableTests.reduce((sum, t) => sum + (t.price * discountRatio * (t.gstPercentage ?? 0)) / 100, 0))
  const grandTotal = taxable + gst

  const couponMutation = useMutation({
    mutationFn: () => validateCoupon(couponInput, postPackageAmount),
    onSuccess: (coupon) => {
      setAppliedCoupon(coupon)
      setCouponError(null)
      cart.setCoupon(coupon.code)
      toast.success(`Coupon ${coupon.code} applied`)
    },
    onError: (err: Error) => setCouponError(err.message),
  })

  const bookingMutation = useMutation({
    mutationFn: async () =>
      createBooking({
        franchiseId: await getFranchiseId(),
        items,
        packageId: cart.selectedPackage?.id,
        packageName: cart.selectedPackage?.name,
        forFamilyMemberId: cart.forFamilyMemberId ?? undefined,
        forFamilyMemberName: patient?.familyMembers.find((m) => m.id === cart.forFamilyMemberId)?.fullName,
        collectionMethod: cart.collectionMethod!,
        addressId: cart.selectedAddress?.id,
        addressLabel: cart.selectedAddress?.label,
        collectionDate: cart.collectionDate!,
        collectionSlot: cart.collectionMethod === "HOME_COLLECTION" ? cart.collectionSlot! : undefined,
        couponCode: appliedCoupon?.code,
        discount: totalDiscount,
        paymentMethod: selectedMethod,
      }),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      setConfirmedBooking(booking)
      cart.reset()
      setAppliedCoupon(null)
      toast.success("Booking confirmed!")
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  useEffect(() => {
    if (patient) setPhoneInput(patient.phone)
  }, [patient])

  if (loadingPatient) {
    return (
      <div>
        <PageHeader title="Book a Test" />
        <LoadingState rows={5} />
      </div>
    )
  }

  if (confirmedBooking) {
    return (
      <div>
        <PageHeader title="Book a Test" />
        <DashboardSectionCard className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
            <PartyPopper className="size-7" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Booking confirmed</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Booking <span className="font-medium text-foreground">#{confirmedBooking.id}</span> is scheduled. We'll send updates as your sample moves through collection and testing.
            {confirmedBooking.paymentStatus === "PENDING" && " Please keep the payment ready to pay the lab in cash."}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" onClick={() => navigate("/patient")}>Go to Dashboard</Button>
            <Button onClick={() => navigate("/patient/bookings")}>View My Bookings</Button>
          </div>
        </DashboardSectionCard>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title="Book a Test" />
        <EmptyState
          title="Your cart is empty"
          description="Browse tests or packages and add them to your cart to start a booking."
          actionLabel="Browse Tests"
          onAction={() => navigate("/patient/tests")}
        />
      </div>
    )
  }

  const canProceed =
    (step === 0 && items.length > 0) ||
    (step === 1 && true) ||
    (step === 2 &&
      !!patient?.phone &&
      cart.collectionMethod !== null &&
      (cart.collectionMethod === "LAB_VISIT" || cart.selectedAddress !== null)) ||
    (step === 3 &&
      cart.collectionDate !== null &&
      (cart.collectionMethod === "LAB_VISIT" || cart.collectionSlot !== null)) ||
    step === 4

  return (
    <div>
      <PageHeader title="Book a Test" description="Complete the steps below to schedule your test." />

      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          {STEPS.map((label, i) => (
            <span key={label} className={cn(i === step && "text-primary", i < step && "text-foreground")}>
              {i < step ? <Check className="inline size-3.5" /> : null} {label}
            </span>
          ))}
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="mt-2" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <DashboardSectionCard>
          {step === 0 && (
            <div>
              <h2 className="mb-4 font-semibold">Review your selection</h2>
              {cart.selectedPackage && (
                <div className="mb-3 rounded-lg border bg-muted/30 p-3">
                  <p className="text-sm font-medium">{cart.selectedPackage.name}</p>
                  <p className="text-xs text-muted-foreground">Package — {items.length} tests included</p>
                </div>
              )}
              <div className="divide-y rounded-lg border">
                {items.map((item) => (
                  <div key={item.testId} className="flex items-center justify-between p-3 text-sm">
                    <span>{item.testName}</span>
                    <span className="text-muted-foreground">{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Who is this booking for?</h2>
                <Button size="sm" variant="outline" type="button" onClick={() => setAddFamilyMemberOpen(true)}>
                  <Plus className="size-4" /> Add family member
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => cart.setForFamilyMember(null)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                    cart.forFamilyMemberId === null ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                  )}
                >
                  <User className="size-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{patient?.fullName} (You)</p>
                    <p className="text-xs text-muted-foreground">Self</p>
                  </div>
                </button>
                {patient?.familyMembers.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => cart.setForFamilyMember(m.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                      cart.forFamilyMemberId === m.id ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                    )}
                  >
                    <User className="size-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{m.fullName}</p>
                      <p className="text-xs text-muted-foreground">{m.relation}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-4 font-semibold">How should we collect the sample?</h2>

              <div className="mb-5">
                <p className="mb-2 text-sm font-medium">Phone number</p>
                {patient?.phone ? (
                  <p className="text-sm text-muted-foreground">{patient.phone}</p>
                ) : (
                  <div className="flex max-w-xs gap-2">
                    <Input
                      placeholder="10-digit mobile number"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={phoneInput.length < 10 || savePhoneMutation.isPending}
                      onClick={() => savePhoneMutation.mutate()}
                    >
                      {savePhoneMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                      Save
                    </Button>
                  </div>
                )}
                {!patient?.phone && <p className="mt-1 text-xs text-muted-foreground">Required before you can book.</p>}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => cart.setCollectionMethod("HOME_COLLECTION")}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                    cart.collectionMethod === "HOME_COLLECTION" ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                  )}
                >
                  <Truck className="mt-0.5 size-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Home Collection</p>
                    <p className="text-xs text-muted-foreground">A technician visits you · +{formatCurrency(HOME_COLLECTION_CHARGE)}</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => cart.setCollectionMethod("LAB_VISIT")}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                    cart.collectionMethod === "LAB_VISIT" ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                  )}
                >
                  <Building2 className="mt-0.5 size-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Visit the Lab</p>
                    <p className="text-xs text-muted-foreground">Walk in at your convenience · No extra charge</p>
                  </div>
                </button>
              </div>

              {cart.collectionMethod === "HOME_COLLECTION" && (
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">Choose an address</p>
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
                          onClick={() => cart.setAddress(addr)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                            cart.selectedAddress?.id === addr.id ? "border-primary bg-primary/5" : "hover:bg-muted/50",
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
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="mb-4 font-semibold">
                {cart.collectionMethod === "LAB_VISIT" ? "Pick a date" : "Pick a date and slot"}
              </h2>
              <p className="mb-2 text-sm font-medium">Date</p>
              <div className="flex flex-wrap gap-2">
                {nextDays(7).map((date) => (
                  <button
                    type="button"
                    key={date}
                    onClick={() => cart.setCollectionSlot(date, cart.collectionMethod === "LAB_VISIT" ? "" : cart.collectionSlot ?? "")}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition-colors",
                      cart.collectionDate === date ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/50",
                    )}
                  >
                    {formatDate(date)}
                  </button>
                ))}
              </div>

              {cart.collectionMethod === "LAB_VISIT" ? (
                <p className="mt-4 text-xs text-muted-foreground">Walk in any time during lab hours on your chosen day — no time slot needed.</p>
              ) : (
                <>
                  <p className="mt-5 mb-2 text-sm font-medium">Time slot</p>
                  <div className="flex flex-wrap gap-2">
                    {COLLECTION_SLOTS.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        disabled={!cart.collectionDate}
                        onClick={() => cart.collectionDate && cart.setCollectionSlot(cart.collectionDate, slot)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                          cart.collectionSlot === slot ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/50",
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  {!cart.collectionDate && <p className="mt-2 text-xs text-muted-foreground">Pick a date first.</p>}
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="mb-4 font-semibold">Coupon &amp; payment</h2>
              <div className="mb-5">
                <p className="mb-2 text-sm font-medium">Have a coupon?</p>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-lg border border-secondary/40 bg-secondary/5 p-3">
                    <div className="flex items-center gap-2">
                      <Tag className="size-4 text-secondary" />
                      <span className="text-sm font-medium">{appliedCoupon.code}</span>
                      <span className="text-xs text-muted-foreground">{appliedCoupon.description}</span>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => {
                        setAppliedCoupon(null)
                        cart.setCoupon(null)
                      }}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    />
                    <Button variant="outline" disabled={!couponInput || couponMutation.isPending} onClick={() => couponMutation.mutate()}>
                      {couponMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                      Apply
                    </Button>
                  </div>
                )}
                {couponError && <p className="mt-2 text-xs text-destructive">{couponError}</p>}
              </div>

              <p className="mb-2 text-sm font-medium">Payment method</p>
              {!hasGateway && (
                <Alert className="mb-3">
                  <AlertDescription>
                    Online payment isn't set up for this lab yet — you can still book now and pay in cash when you visit or when the sample is collected.
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {ONLINE_PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                  <button
                    type="button"
                    key={value}
                    disabled={!hasGateway}
                    onClick={() => setPaymentMethod(value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                      hasGateway && selectedMethod === value ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/50",
                    )}
                  >
                    <Icon className="size-5" />
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors",
                    selectedMethod === "CASH" ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/50",
                  )}
                >
                  <CASH_PAYMENT_METHOD.icon className="size-5" />
                  {CASH_PAYMENT_METHOD.label}
                </button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {selectedMethod === "CASH"
                  ? "Pay the lab directly when your sample is collected or when you visit — no online charge is made."
                  : "This is a mock payment for demo purposes — no real transaction is made."}
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ChevronLeft className="size-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} disabled={!canProceed}>
                Next <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={() => bookingMutation.mutate()} disabled={bookingMutation.isPending}>
                {bookingMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {selectedMethod === "CASH" ? `Confirm Booking · ${formatCurrency(grandTotal)}` : `Pay ${formatCurrency(grandTotal)}`}
              </Button>
            )}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard className="h-fit">
          <h2 className="mb-4 font-semibold">Order summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(rawSubtotal)}</span>
            </div>
            {packageDiscount > 0 && (
              <div className="flex justify-between text-secondary">
                <span>Package savings</span>
                <span>-{formatCurrency(packageDiscount)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-secondary">
                <span>Coupon ({appliedCoupon?.code})</span>
                <span>-{formatCurrency(couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Collection charge</span>
              <span>{collectionCharge > 0 ? formatCurrency(collectionCharge) : "Free"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST</span>
              <span>{formatCurrency(gst)}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t pt-3 text-base font-bold">
            <span>Total</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
          {cart.collectionDate && (
            <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p>{formatDate(cart.collectionDate)}{cart.collectionSlot ? ` · ${cart.collectionSlot}` : ""}</p>
              {cart.collectionMethod && (
                <p className="mt-0.5">{cart.collectionMethod === "HOME_COLLECTION" ? "Home collection" : "Lab visit"}</p>
              )}
            </div>
          )}
          <Badge variant="secondary" className="mt-4 w-full justify-center py-1.5">
            Step {step + 1} of {STEPS.length}
          </Badge>
        </DashboardSectionCard>
      </div>

      <AddFamilyMemberDialog
        open={addFamilyMemberOpen}
        onOpenChange={setAddFamilyMemberOpen}
        onAdded={(members) => {
          const newest = members[members.length - 1]
          if (newest) cart.setForFamilyMember(newest.id)
        }}
      />
      <AddAddressDialog
        open={addAddressOpen}
        onOpenChange={setAddAddressOpen}
        onAdded={(addresses) => {
          const newest = addresses[addresses.length - 1]
          if (newest) cart.setAddress(newest)
        }}
      />
    </div>
  )
}
