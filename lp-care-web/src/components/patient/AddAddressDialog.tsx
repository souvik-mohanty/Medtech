import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { addAddress } from "@/services/api/patientsApi"
import { getServiceablePincodes } from "@/services/api/franchiseApi"
import { errorMessage } from "@/lib/apiClient"
import type { Address } from "@/types"

const emptyForm = { label: "", line1: "", line2: "", city: "", state: "", pincode: "", isDefault: false }

interface AddAddressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded?: (addresses: Address[]) => void
}

export function AddAddressDialog({ open, onOpenChange, onAdded }: AddAddressDialogProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)

  const { data: servicePincodes } = useQuery({
    queryKey: ["serviceable-pincodes"],
    queryFn: getServiceablePincodes,
    enabled: open,
  })

  const pincodeValid = form.pincode.length !== 6 || !servicePincodes || servicePincodes.length === 0 || servicePincodes.includes(form.pincode)

  const saveMutation = useMutation({
    mutationFn: () => addAddress(form),
    onSuccess: (patient) => {
      queryClient.setQueryData(["currentPatient"], patient)
      toast.success("Address added")
      setForm(emptyForm)
      onOpenChange(false)
      onAdded?.(patient.addresses)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add address</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!pincodeValid) return
            saveMutation.mutate()
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="addr-label">Label</Label>
            <Input id="addr-label" placeholder="e.g. Home, Office" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addr-line1">Address line 1</Label>
            <Input id="addr-line1" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addr-line2">Address line 2 (optional)</Label>
            <Input id="addr-line2" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="addr-city">City</Label>
              <Input id="addr-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-state">State</Label>
              <Input id="addr-state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addr-pincode">Pincode</Label>
            <Input
              id="addr-pincode"
              inputMode="numeric"
              maxLength={6}
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              required
            />
            {!pincodeValid && (
              <Alert variant="destructive">
                <AlertDescription>Sorry, we don't currently serve pincode {form.pincode}.</AlertDescription>
              </Alert>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="addr-default" checked={form.isDefault} onCheckedChange={(v) => setForm({ ...form, isDefault: v === true })} />
            <Label htmlFor="addr-default" className="font-normal">Set as default address</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending || !pincodeValid}>
              {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Add address
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
