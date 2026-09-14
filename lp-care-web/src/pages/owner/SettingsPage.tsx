import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, Trash2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/common/PageHeader"
import { DashboardSectionCard } from "@/components/layouts/DashboardShell"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { getPaymentGatewayConfig, removePaymentGatewayConfig, savePaymentGatewayConfig } from "@/services/api/paymentGatewayApi"
import { getFranchiseProfile, updateFranchiseProfile } from "@/services/api/franchiseApi"
import { formatDateTime } from "@/lib/utils"
import type { PaymentGatewayProvider } from "@/types"

const PROVIDER_LABEL: Record<PaymentGatewayProvider, string> = { RAZORPAY: "Razorpay", PHONEPE: "PhonePe" }

export function OwnerSettingsPage() {
  const queryClient = useQueryClient()
  const { data: gateway, isLoading: loadingGateway } = useQuery({ queryKey: ["payment-gateway"], queryFn: getPaymentGatewayConfig })
  const [provider, setProvider] = useState<PaymentGatewayProvider>("RAZORPAY")
  const [apiKey, setApiKey] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [removeOpen, setRemoveOpen] = useState(false)

  const saveGatewayMutation = useMutation({
    mutationFn: () => savePaymentGatewayConfig({ provider, apiKey, apiSecret }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-gateway"] })
      toast.success(`${PROVIDER_LABEL[provider]} connected — online payments are now enabled for patients`)
      setApiKey("")
      setApiSecret("")
    },
  })

  const removeGatewayMutation = useMutation({
    mutationFn: removePaymentGatewayConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-gateway"] })
      toast.success("Payment gateway removed — patients will only see the pay-at-lab option")
      setRemoveOpen(false)
    },
  })

  const { data: profile, isLoading: loadingProfile } = useQuery({ queryKey: ["franchise-profile"], queryFn: getFranchiseProfile })

  const [labName, setLabName] = useState("")
  const [gstin, setGstin] = useState("")
  // Not backed by the franchise profile endpoint yet — kept local-only for now.
  const [address, setAddress] = useState("Station Square, Khordha, Odisha 752057")
  const [openTime, setOpenTime] = useState("07:00")
  const [closeTime, setCloseTime] = useState("20:00")
  const [collectionCharge, setCollectionCharge] = useState(99)
  const [freeCollectionMinOrder, setFreeCollectionMinOrder] = useState("")
  const [pincodes, setPincodes] = useState<string[]>([])
  const [pincodeInput, setPincodeInput] = useState("")
  const [invoiceHeaderNote, setInvoiceHeaderNote] = useState("")
  const [invoiceFooterNote, setInvoiceFooterNote] = useState("")

  useEffect(() => {
    if (!profile) return
    setLabName(profile.name)
    setGstin(profile.gstin ?? "")
    setCollectionCharge(profile.collectionCharge)
    setFreeCollectionMinOrder(profile.freeCollectionMinOrder != null ? String(profile.freeCollectionMinOrder) : "")
    setPincodes(profile.serviceablePincodes)
    setInvoiceHeaderNote(profile.invoiceHeaderNote ?? "")
    setInvoiceFooterNote(profile.invoiceFooterNote ?? "")
  }, [profile])

  function addPincode() {
    const value = pincodeInput.trim()
    if (value && /^\d{6}$/.test(value) && !pincodes.includes(value)) {
      setPincodes((p) => [...p, value])
      setPincodeInput("")
    }
  }

  const saveProfileMutation = useMutation({
    mutationFn: () => {
      if (!profile) throw new Error("Profile not loaded yet")
      const trimmedMinOrder = freeCollectionMinOrder.trim()
      return updateFranchiseProfile({
        ...profile,
        name: labName,
        gstin: gstin || null,
        collectionCharge,
        freeCollectionMinOrder: trimmedMinOrder === "" ? null : Number(trimmedMinOrder),
        serviceablePincodes: pincodes,
        invoiceHeaderNote: invoiceHeaderNote || null,
        invoiceFooterNote: invoiceFooterNote || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["franchise-profile"] })
      toast.success("Settings saved")
    },
  })

  return (
    <div>
      <PageHeader title="Laboratory Settings" description="Laboratory profile, GST details, working hours, collection charges, and serviceable pincodes." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Laboratory profile</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">Laboratory name</Label>
              <Input id="s-name" value={labName} onChange={(e) => setLabName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-gstin">GSTIN</Label>
              <Input id="s-gstin" value={gstin} onChange={(e) => setGstin(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-address">Address</Label>
              <Input id="s-address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Invoice PDF</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Printed on every generated invoice — header appears below your logo/contact details, footer appears at the bottom of the page.
          </p>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="s-inv-header">Header note (optional)</Label>
              <Textarea
                id="s-inv-header"
                placeholder="e.g. Thank you for choosing us — terms and conditions apply."
                value={invoiceHeaderNote}
                onChange={(e) => setInvoiceHeaderNote(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-inv-footer">Footer note (optional)</Label>
              <Textarea
                id="s-inv-footer"
                placeholder="e.g. This is a computer-generated invoice and does not require a signature."
                value={invoiceFooterNote}
                onChange={(e) => setInvoiceFooterNote(e.target.value)}
              />
            </div>
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard>
          <h2 className="mb-4 font-semibold">Working hours &amp; charges</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="s-open">Opens at</Label>
                <Input id="s-open" type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-close">Closes at</Label>
                <Input id="s-close" type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-charge">Home collection charge (₹)</Label>
              <Input id="s-charge" type="number" min={0} value={collectionCharge} onChange={(e) => setCollectionCharge(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-min-order">Minimum order for free collection (₹)</Label>
              <Input
                id="s-min-order"
                type="number"
                min={0}
                placeholder="Leave blank to always charge"
                value={freeCollectionMinOrder}
                onChange={(e) => setFreeCollectionMinOrder(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Orders at or above this amount get free home collection. Leave blank to always charge the fee above.
              </p>
            </div>
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard className="lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <CreditCard className="size-4 text-primary" /> Payment gateway
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Connect your Razorpay or PhonePe account to accept online payments during booking. Without one, patients can still book and pay in cash at the lab.
          </p>

          {loadingGateway ? null : gateway ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-success/30 bg-success/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-success/10 text-success">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{PROVIDER_LABEL[gateway.provider]}</p>
                    <Badge variant="secondary" className="gap-1 text-success">
                      <CheckCircle2 className="size-3" /> Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    API key <span className="font-mono">{gateway.apiKey}</span> · Secret <span className="font-mono">{gateway.maskedSecret}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Connected {formatDateTime(gateway.updatedAt)}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setRemoveOpen(true)}>
                <Trash2 className="size-3.5 text-destructive" /> Remove
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                saveGatewayMutation.mutate()
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Provider</Label>
                  <Select value={provider} onValueChange={(v) => setProvider(v as PaymentGatewayProvider)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RAZORPAY">Razorpay</SelectItem>
                      <SelectItem value="PHONEPE">PhonePe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pg-key">API key</Label>
                  <Input id="pg-key" placeholder={provider === "RAZORPAY" ? "rzp_live_…" : "PHONEPE_…"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pg-secret">API secret</Label>
                  <Input id="pg-secret" type="password" placeholder="••••••••" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} required />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Demo only — no real credentials are sent or stored anywhere. The secret is never shown again once saved, only a masked version.
              </p>
              <Button type="submit" disabled={saveGatewayMutation.isPending || !apiKey || !apiSecret}>
                {saveGatewayMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Connect {PROVIDER_LABEL[provider]}
              </Button>
            </form>
          )}
        </DashboardSectionCard>

        <DashboardSectionCard className="lg:col-span-2">
          <h2 className="mb-4 font-semibold">Serviceable pincodes</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Patients can only save an address in one of these pincodes. Leave empty to allow any pincode.
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {pincodes.map((pc) => (
              <Badge key={pc} variant="secondary" className="gap-1 py-1 pr-1">
                {pc}
                <button type="button" onClick={() => setPincodes((p) => p.filter((x) => x !== pc))} className="rounded-full p-0.5 hover:bg-muted">
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex max-w-xs gap-2">
            <Input
              placeholder="6-digit pincode"
              value={pincodeInput}
              onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addPincode()
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addPincode}>Add</Button>
          </div>
        </DashboardSectionCard>
      </div>

      <Button className="mt-5" onClick={() => saveProfileMutation.mutate()} disabled={saveProfileMutation.isPending || loadingProfile}>
        {saveProfileMutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Save settings
      </Button>

      <ConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title="Remove payment gateway?"
        description="Patients will no longer be able to pay online — only the pay-at-lab (cash) option will be shown during booking."
        confirmLabel="Remove"
        destructive
        isLoading={removeGatewayMutation.isPending}
        onConfirm={() => removeGatewayMutation.mutate()}
      />
    </div>
  )
}
