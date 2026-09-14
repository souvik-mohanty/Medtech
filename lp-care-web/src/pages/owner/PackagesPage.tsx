import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Package, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { createPackage, getAllPackages, getAllTests, togglePackageActive } from "@/services/api/testsApi"
import { formatCurrency } from "@/lib/utils"

const emptyForm = {
  name: "",
  description: "",
  testIds: [] as string[],
  discountedPrice: 0,
  preparationInstructions: "No special preparation required.",
  reportTurnaroundHours: 24,
}

export function OwnerPackagesPage() {
  const queryClient = useQueryClient()
  const { data: packages, isLoading } = useQuery({ queryKey: ["owner-packages"], queryFn: getAllPackages })
  const { data: tests } = useQuery({ queryKey: ["owner-tests"], queryFn: getAllTests })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const createMutation = useMutation({
    mutationFn: () => createPackage(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-packages"] })
      queryClient.invalidateQueries({ queryKey: ["packages"] })
      toast.success("Package created")
      setDialogOpen(false)
      setForm(emptyForm)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => togglePackageActive(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["owner-packages"] })
      queryClient.invalidateQueries({ queryKey: ["packages"] })
      toast.success(updated.active ? "Package activated" : "Package deactivated")
    },
  })

  function toggleTestInForm(id: string) {
    setForm((f) => ({ ...f, testIds: f.testIds.includes(id) ? f.testIds.filter((t) => t !== id) : [...f.testIds, id] }))
  }

  const activeTests = (tests ?? []).filter((t) => t.active)

  return (
    <div>
      <PageHeader
        title="Test Packages"
        description="Create and edit health packages from your test catalog."
        actions={
          <Button onClick={() => { setForm(emptyForm); setDialogOpen(true) }} disabled={activeTests.length === 0}>
            <Plus className="size-4" /> Add package
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState rows={6} />
      ) : !packages || packages.length === 0 ? (
        <EmptyState icon={Package} title="No packages yet" actionLabel="Add package" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={p.active ? "secondary" : "outline"}>{p.active ? "Active" : "Inactive"}</Badge>
                </div>
                <CardTitle className="text-base">{p.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{p.tests.length} tests included</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold">{formatCurrency(p.discountedPrice)}</span>
                  <span className="text-xs text-muted-foreground line-through">{formatCurrency(p.totalPrice)}</span>
                </div>
                <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => toggleMutation.mutate(p.id)} disabled={toggleMutation.isPending}>
                  {p.active ? "Deactivate" : "Activate"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a package</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate()
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Package name</Label>
              <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea id="p-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Included tests</Label>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
                {activeTests.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 rounded p-1.5 text-sm hover:bg-muted/50">
                    <Checkbox checked={form.testIds.includes(t.id)} onCheckedChange={() => toggleTestInForm(t.id)} />
                    {t.name} <span className="text-xs text-muted-foreground">({formatCurrency(t.price)})</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Package price (₹)</Label>
                <Input id="p-price" type="number" min={0} value={form.discountedPrice} onChange={(e) => setForm({ ...form, discountedPrice: Number(e.target.value) })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-turnaround">Report turnaround (hours)</Label>
                <Input id="p-turnaround" type="number" min={1} value={form.reportTurnaroundHours} onChange={(e) => setForm({ ...form, reportTurnaroundHours: Number(e.target.value) })} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || form.testIds.length === 0}>Create package</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
