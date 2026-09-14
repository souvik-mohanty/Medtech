import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { createCoupon, getCoupons, toggleCouponActive } from "@/services/api/couponsApi"
import { formatDate } from "@/lib/utils"
import type { CouponType } from "@/types"

const emptyForm = {
  code: "",
  type: "PERCENTAGE" as CouponType,
  value: 10,
  description: "",
  minOrderAmount: undefined as number | undefined,
  expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  usageLimit: undefined as number | undefined,
}

export function OwnerCouponsPage() {
  const queryClient = useQueryClient()
  const { data: coupons, isLoading } = useQuery({ queryKey: ["owner-coupons"], queryFn: getCoupons })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const createMutation = useMutation({
    mutationFn: () =>
      createCoupon({
        ...form,
        code: form.code.toUpperCase(),
        expiresAt: new Date(form.expiresAt).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-coupons"] })
      toast.success("Coupon created")
      setDialogOpen(false)
      setForm(emptyForm)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleCouponActive(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["owner-coupons"] })
      toast.success(updated.active ? "Coupon activated" : "Coupon deactivated")
    },
  })

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Create flat or percentage discount coupons."
        actions={
          <Button onClick={() => { setForm(emptyForm); setDialogOpen(true) }}>
            <Plus className="size-4" /> Add coupon
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState rows={4} />
      ) : !coupons || coupons.length === 0 ? (
        <EmptyState icon={Tag} title="No coupons yet" actionLabel="Add coupon" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm font-medium">{c.code}</TableCell>
                  <TableCell className="text-sm">{c.type === "FLAT" ? `₹${c.value} off` : `${c.value}% off`}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.description}</TableCell>
                  <TableCell className="text-sm">{c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(c.expiresAt)}</TableCell>
                  <TableCell>
                    <Badge variant={c.active ? "secondary" : "outline"}>{c.active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => toggleMutation.mutate(c.id)} disabled={toggleMutation.isPending}>
                      {c.active ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a coupon</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate()
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="c-code">Code</Label>
                <Input id="c-code" placeholder="e.g. WELCOME10" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as CouponType })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FLAT">Flat amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-desc">Description</Label>
              <Input id="c-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="c-value">{form.type === "FLAT" ? "Amount off (₹)" : "Percent off (%)"}</Label>
                <Input id="c-value" type="number" min={1} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-min">Min order (₹, optional)</Label>
                <Input id="c-min" type="number" min={0} value={form.minOrderAmount ?? ""} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="c-expiry">Expires on</Label>
                <Input id="c-expiry" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-limit">Usage limit (optional)</Label>
                <Input id="c-limit" type="number" min={1} value={form.usageLimit ?? ""} onChange={(e) => setForm({ ...form, usageLimit: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>Create coupon</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
