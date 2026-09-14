import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, TestTube2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { createTest, getAllTests, toggleTestActive, type CreateTestInput } from "@/services/api/testsApi"
import { formatCurrency } from "@/lib/utils"
import type { TestCategory } from "@/types"

const CATEGORIES: TestCategory[] = [
  "BLOOD", "URINE", "HORMONE", "DIABETES", "LIPID_PROFILE", "LIVER_FUNCTION", "KIDNEY_FUNCTION", "THYROID", "VITAMIN", "ROUTINE_HEALTH",
]

const emptyForm: CreateTestInput = {
  name: "",
  code: "",
  category: "BLOOD",
  description: "",
  price: 0,
  sampleType: "Blood",
  preparationInstructions: "No special preparation required.",
  reportTurnaroundHours: 24,
  prescriptionRequired: false,
}

export function OwnerTestsPage() {
  const queryClient = useQueryClient()
  const { data: tests, isLoading } = useQuery({ queryKey: ["owner-tests"], queryFn: getAllTests })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<CreateTestInput>(emptyForm)

  const createMutation = useMutation({
    mutationFn: () => createTest(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-tests"] })
      queryClient.invalidateQueries({ queryKey: ["tests"] })
      toast.success("Test added to catalog")
      setDialogOpen(false)
      setForm(emptyForm)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleTestActive(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["owner-tests"] })
      queryClient.invalidateQueries({ queryKey: ["tests"] })
      toast.success(updated.active ? "Test activated" : "Test deactivated")
    },
  })

  return (
    <div>
      <PageHeader
        title="Pathology Tests"
        description="Create, edit, and (de)activate pathology tests."
        actions={
          <Button onClick={() => { setForm(emptyForm); setDialogOpen(true) }}>
            <Plus className="size-4" /> Add test
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState rows={6} />
      ) : !tests || tests.length === 0 ? (
        <EmptyState icon={TestTube2} title="No tests in your catalog yet" actionLabel="Add test" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sample</TableHead>
                <TableHead>Turnaround</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.code}</p>
                  </TableCell>
                  <TableCell className="text-sm">{t.category.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.sampleType}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.reportTurnaroundHours}h</TableCell>
                  <TableCell className="text-sm font-medium">{formatCurrency(t.price)}</TableCell>
                  <TableCell>
                    <Badge variant={t.active ? "secondary" : "outline"}>{t.active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => toggleMutation.mutate(t.id)} disabled={toggleMutation.isPending}>
                      {t.active ? "Deactivate" : "Activate"}
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
            <DialogTitle>Add a test</DialogTitle>
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
                <Label htmlFor="t-name">Test name</Label>
                <Input id="t-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-code">Code</Label>
                <Input id="t-code" placeholder="e.g. CBC" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-desc">Description</Label>
              <Textarea id="t-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as TestCategory })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-sample">Sample type</Label>
                <Input id="t-sample" value={form.sampleType} onChange={(e) => setForm({ ...form, sampleType: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="t-price">Price (₹)</Label>
                <Input id="t-price" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-turnaround">Report turnaround (hours)</Label>
                <Input id="t-turnaround" type="number" min={1} value={form.reportTurnaroundHours} onChange={(e) => setForm({ ...form, reportTurnaroundHours: Number(e.target.value) })} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-prep">Preparation instructions</Label>
              <Textarea id="t-prep" value={form.preparationInstructions} onChange={(e) => setForm({ ...form, preparationInstructions: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.prescriptionRequired} onCheckedChange={(v) => setForm({ ...form, prescriptionRequired: v === true })} />
              Prescription required
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>Add test</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
