import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Package, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { createProduct, getAllProducts, toggleProductActive, updateProduct, type ProductInput } from "@/services/api/productsApi"
import { errorMessage } from "@/lib/apiClient"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Product } from "@/types"

const EXPIRY_SOON_DAYS = 30

type StockFilter = "ALL" | "EXPIRING_SOON" | "EXPIRED"

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - new Date(today()).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

function emptyForm(): ProductInput {
  return {
    name: "",
    unit: "",
    sellingPrice: 0,
    purchasePrice: undefined,
    mfgDate: undefined,
    purchaseDate: today(),
    supplier: undefined,
    expiryDate: undefined,
    stockQuantity: 0,
    gstPercentage: 0,
    prescriptionRequired: false,
    salesChannel: "BOTH",
  }
}

const CHANNEL_LABELS: Record<Product["salesChannel"], string> = {
  ONLINE: "Online only",
  WALKIN: "Express only",
  BOTH: "Online + Express",
}

export function OwnerInventoryPage() {
  const queryClient = useQueryClient()
  const { data: products, isLoading } = useQuery({ queryKey: ["owner-products"], queryFn: getAllProducts })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductInput>(emptyForm)
  const [stockFilter, setStockFilter] = useState<StockFilter>("ALL")

  const filteredProducts = (products ?? []).filter((p) => {
    if (stockFilter === "ALL") return true
    if (!p.expiryDate) return false
    const days = daysUntil(p.expiryDate)
    if (stockFilter === "EXPIRED") return days < 0
    return days >= 0 && days <= EXPIRY_SOON_DAYS
  })

  function openAdd() {
    setEditing(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setForm({
      name: product.name,
      unit: product.unit ?? "",
      sellingPrice: product.sellingPrice,
      purchasePrice: product.purchasePrice,
      mfgDate: product.mfgDate,
      purchaseDate: product.purchaseDate,
      supplier: product.supplier,
      expiryDate: product.expiryDate,
      stockQuantity: product.stockQuantity,
      gstPercentage: product.gstPercentage,
      prescriptionRequired: product.prescriptionRequired,
      salesChannel: product.salesChannel,
    })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => (editing ? updateProduct(editing.id, form) : createProduct(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-products"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success(editing ? "Product updated" : "Product added")
      setDialogOpen(false)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleProductActive(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["owner-products"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success(updated.active ? "Product activated" : "Product deactivated")
    },
  })

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Medicines and equipment patients can order, with stock and prescription requirements."
        actions={
          <Button onClick={openAdd}>
            <Plus className="size-4" /> Add product
          </Button>
        }
      />

      {!isLoading && products && products.length > 0 && (
        <div className="mb-4 w-full sm:w-64">
          <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockFilter)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All products</SelectItem>
              <SelectItem value="EXPIRING_SOON">Expiring within 30 days</SelectItem>
              <SelectItem value="EXPIRED">Already expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <LoadingState rows={6} />
      ) : !products || products.length === 0 ? (
        <EmptyState icon={Package} title="No products yet" actionLabel="Add product" onAction={openAdd} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState icon={Package} title="No products match this filter" />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Purchased</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">{p.name}</p>
                    <div className="flex items-center gap-1.5">
                      {p.unit && <p className="text-xs text-muted-foreground">{p.unit}</p>}
                      {p.prescriptionRequired && <Badge variant="outline" className="text-[10px] text-warning-foreground">Rx</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{formatCurrency(p.sellingPrice)}</TableCell>
                  <TableCell className="text-sm">
                    <span className={p.stockQuantity <= 0 ? "text-destructive" : ""}>{p.stockQuantity}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.purchaseDate ? formatDate(p.purchaseDate) : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.supplier || "—"}</TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="outline" className="text-muted-foreground">{CHANNEL_LABELS[p.salesChannel]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.expiryDate ? (
                      <span className={daysUntil(p.expiryDate) < 0 ? "text-destructive" : daysUntil(p.expiryDate) <= EXPIRY_SOON_DAYS ? "text-warning-foreground" : ""}>
                        {formatDate(p.expiryDate)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.active ? "secondary" : "outline"}>{p.active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(p)}>Edit</Button>
                    <Button size="sm" variant="outline" disabled={toggleMutation.isPending} onClick={() => toggleMutation.mutate(p.id)}>
                      {p.active ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              saveMutation.mutate()
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Name</Label>
                <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-unit">Unit</Label>
                <Input id="p-unit" placeholder="e.g. strip, bottle" value={form.unit ?? ""} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Selling price (₹)</Label>
                <Input id="p-price" type="number" min={0} value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-purchase-price">Purchase price (₹)</Label>
                <Input
                  id="p-purchase-price"
                  type="number"
                  min={0}
                  value={form.purchasePrice ?? ""}
                  onChange={(e) => setForm({ ...form, purchasePrice: e.target.value === "" ? undefined : Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-gst">GST (%)</Label>
                <Input id="p-gst" type="number" min={0} value={form.gstPercentage} onChange={(e) => setForm({ ...form, gstPercentage: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-stock">Stock quantity</Label>
                <Input id="p-stock" type="number" min={0} value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Sell via</Label>
              <Select value={form.salesChannel} onValueChange={(v) => setForm({ ...form, salesChannel: v as Product["salesChannel"] })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOTH">Online + Express</SelectItem>
                  <SelectItem value="ONLINE">Online only</SelectItem>
                  <SelectItem value="WALKIN">Express only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Controls whether patients see this online, whether it appears in Express Billing, or both.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-purchase">Purchase date</Label>
                <Input id="p-purchase" type="date" value={form.purchaseDate ?? ""} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value || undefined })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-supplier">Supplier (optional)</Label>
                <Input id="p-supplier" placeholder="e.g. Apex Pharma Distributors" value={form.supplier ?? ""} onChange={(e) => setForm({ ...form, supplier: e.target.value || undefined })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-mfg">Mfg date (optional)</Label>
                <Input id="p-mfg" type="date" value={form.mfgDate ?? ""} onChange={(e) => setForm({ ...form, mfgDate: e.target.value || undefined })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-expiry">Expiry date (optional)</Label>
                <Input id="p-expiry" type="date" value={form.expiryDate ?? ""} onChange={(e) => setForm({ ...form, expiryDate: e.target.value || undefined })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.prescriptionRequired} onCheckedChange={(v) => setForm({ ...form, prescriptionRequired: v === true })} />
              Prescription required
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{editing ? "Save changes" : "Add product"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
