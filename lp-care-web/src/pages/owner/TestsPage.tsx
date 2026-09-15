import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Package, Plus, TestTube2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import {
  createPackage,
  createTest,
  deletePackage,
  deleteTest,
  getAllPackages,
  getAllTests,
  togglePackageActive,
  toggleTestActive,
  updatePackage,
  updateTest,
  type CreatePackageInput,
  type CreateTestInput,
} from "@/services/api/testsApi"
import { errorMessage } from "@/lib/apiClient"
import { formatCurrency } from "@/lib/utils"
import type { PathologyTest, TestCategory, TestPackage } from "@/types"

const CATEGORIES: TestCategory[] = [
  "BLOOD", "URINE", "HORMONE", "DIABETES", "LIPID_PROFILE", "LIVER_FUNCTION", "KIDNEY_FUNCTION", "THYROID", "VITAMIN", "ROUTINE_HEALTH",
]

const emptyTestForm: CreateTestInput = {
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

const emptyPackageForm: CreatePackageInput = {
  name: "",
  description: "",
  testIds: [],
  discountedPrice: 0,
  preparationInstructions: "No special preparation required.",
  reportTurnaroundHours: 24,
}

export function OwnerTestsPage() {
  const queryClient = useQueryClient()
  const { data: tests, isLoading: loadingTests } = useQuery({ queryKey: ["owner-tests"], queryFn: getAllTests })
  const { data: packages, isLoading: loadingPackages } = useQuery({ queryKey: ["owner-packages"], queryFn: getAllPackages })

  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [editingTest, setEditingTest] = useState<PathologyTest | null>(null)
  const [testForm, setTestForm] = useState<CreateTestInput>(emptyTestForm)
  const [deleteTestTarget, setDeleteTestTarget] = useState<PathologyTest | null>(null)

  const [packageDialogOpen, setPackageDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<TestPackage | null>(null)
  const [packageForm, setPackageForm] = useState<CreatePackageInput>(emptyPackageForm)
  const [deletePackageTarget, setDeletePackageTarget] = useState<TestPackage | null>(null)

  const activeTests = (tests ?? []).filter((t) => t.active)

  function openAddTest() {
    setEditingTest(null)
    setTestForm(emptyTestForm)
    setTestDialogOpen(true)
  }

  function openEditTest(test: PathologyTest) {
    setEditingTest(test)
    setTestForm({
      name: test.name,
      code: test.code,
      category: test.category,
      description: test.description,
      price: test.price,
      sampleType: test.sampleType,
      preparationInstructions: test.preparationInstructions,
      reportTurnaroundHours: test.reportTurnaroundHours,
      prescriptionRequired: test.prescriptionRequired,
    })
    setTestDialogOpen(true)
  }

  const saveTestMutation = useMutation({
    mutationFn: () => (editingTest ? updateTest(editingTest.id, testForm) : createTest(testForm)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-tests"] })
      queryClient.invalidateQueries({ queryKey: ["tests"] })
      toast.success(editingTest ? "Test updated" : "Test added to catalog")
      setTestDialogOpen(false)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const toggleTestMutation = useMutation({
    mutationFn: (id: string) => toggleTestActive(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["owner-tests"] })
      queryClient.invalidateQueries({ queryKey: ["tests"] })
      toast.success(updated.active ? "Test activated" : "Test deactivated")
    },
  })

  const deleteTestMutation = useMutation({
    mutationFn: (id: string) => deleteTest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-tests"] })
      queryClient.invalidateQueries({ queryKey: ["tests"] })
      toast.success("Test deleted")
      setDeleteTestTarget(null)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  function openAddPackage() {
    setEditingPackage(null)
    setPackageForm(emptyPackageForm)
    setPackageDialogOpen(true)
  }

  function openEditPackage(pkg: TestPackage) {
    setEditingPackage(pkg)
    setPackageForm({
      name: pkg.name,
      description: pkg.description,
      testIds: pkg.tests.map((t) => t.id),
      discountedPrice: pkg.discountedPrice,
      preparationInstructions: pkg.preparationInstructions,
      reportTurnaroundHours: pkg.reportTurnaroundHours,
    })
    setPackageDialogOpen(true)
  }

  const savePackageMutation = useMutation({
    mutationFn: () => (editingPackage ? updatePackage(editingPackage.id, packageForm) : createPackage(packageForm)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-packages"] })
      queryClient.invalidateQueries({ queryKey: ["packages"] })
      toast.success(editingPackage ? "Package updated" : "Package created")
      setPackageDialogOpen(false)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const togglePackageMutation = useMutation({
    mutationFn: (id: string) => togglePackageActive(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["owner-packages"] })
      queryClient.invalidateQueries({ queryKey: ["packages"] })
      toast.success(updated.active ? "Package activated" : "Package deactivated")
    },
  })

  const deletePackageMutation = useMutation({
    mutationFn: (id: string) => deletePackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-packages"] })
      queryClient.invalidateQueries({ queryKey: ["packages"] })
      toast.success("Package deleted")
      setDeletePackageTarget(null)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  function toggleTestInPackageForm(id: string) {
    setPackageForm((f) => ({ ...f, testIds: f.testIds.includes(id) ? f.testIds.filter((t) => t !== id) : [...f.testIds, id] }))
  }

  return (
    <div>
      <PageHeader title="Pathology Tests & Packages" description="Create, edit, and delete pathology tests and the packages built from them." />

      <Tabs defaultValue="tests">
        <TabsList>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
        </TabsList>

        <TabsContent value="tests">
          <div className="mb-4 flex justify-end">
            <Button onClick={openAddTest}>
              <Plus className="size-4" /> Add test
            </Button>
          </div>

          {loadingTests ? (
            <LoadingState rows={6} />
          ) : !tests || tests.length === 0 ? (
            <EmptyState icon={TestTube2} title="No tests in your catalog yet" actionLabel="Add test" onAction={openAddTest} />
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
                      <TableCell className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditTest(t)}>Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => toggleTestMutation.mutate(t.id)} disabled={toggleTestMutation.isPending}>
                          {t.active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteTestTarget(t)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="packages">
          <div className="mb-4 flex justify-end">
            <Button onClick={openAddPackage} disabled={activeTests.length === 0}>
              <Plus className="size-4" /> Add package
            </Button>
          </div>

          {loadingPackages ? (
            <LoadingState rows={6} />
          ) : !packages || packages.length === 0 ? (
            <EmptyState icon={Package} title="No packages yet" actionLabel="Add package" onAction={openAddPackage} />
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
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditPackage(p)}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => togglePackageMutation.mutate(p.id)} disabled={togglePackageMutation.isPending}>
                        {p.active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeletePackageTarget(p)}>
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTest ? "Edit test" : "Add a test"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              saveTestMutation.mutate()
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="t-name">Test name</Label>
                <Input id="t-name" value={testForm.name} onChange={(e) => setTestForm({ ...testForm, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-code">Code</Label>
                <Input id="t-code" placeholder="e.g. CBC" value={testForm.code} onChange={(e) => setTestForm({ ...testForm, code: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-desc">Description</Label>
              <Textarea id="t-desc" value={testForm.description} onChange={(e) => setTestForm({ ...testForm, description: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={testForm.category} onValueChange={(v) => setTestForm({ ...testForm, category: v as TestCategory })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-sample">Sample type</Label>
                <Input id="t-sample" value={testForm.sampleType} onChange={(e) => setTestForm({ ...testForm, sampleType: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="t-price">Price (₹)</Label>
                <Input id="t-price" type="number" min={0} value={testForm.price} onChange={(e) => setTestForm({ ...testForm, price: Number(e.target.value) })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-turnaround">Report turnaround (hours)</Label>
                <Input id="t-turnaround" type="number" min={1} value={testForm.reportTurnaroundHours} onChange={(e) => setTestForm({ ...testForm, reportTurnaroundHours: Number(e.target.value) })} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-prep">Preparation instructions</Label>
              <Textarea id="t-prep" value={testForm.preparationInstructions} onChange={(e) => setTestForm({ ...testForm, preparationInstructions: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={testForm.prescriptionRequired} onCheckedChange={(v) => setTestForm({ ...testForm, prescriptionRequired: v === true })} />
              Prescription required
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTestDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveTestMutation.isPending}>{editingTest ? "Save changes" : "Add test"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTestTarget}
        onOpenChange={(open) => !open && setDeleteTestTarget(null)}
        title="Delete this test?"
        description={`"${deleteTestTarget?.name}" will be permanently removed. Tests with booking history can't be deleted — deactivate them instead.`}
        confirmLabel="Delete"
        destructive
        isLoading={deleteTestMutation.isPending}
        onConfirm={() => deleteTestTarget && deleteTestMutation.mutate(deleteTestTarget.id)}
      />

      <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPackage ? "Edit package" : "Add a package"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              savePackageMutation.mutate()
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Package name</Label>
              <Input id="p-name" value={packageForm.name} onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea id="p-desc" value={packageForm.description} onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Included tests</Label>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
                {activeTests.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 rounded p-1.5 text-sm hover:bg-muted/50">
                    <Checkbox checked={packageForm.testIds.includes(t.id)} onCheckedChange={() => toggleTestInPackageForm(t.id)} />
                    {t.name} <span className="text-xs text-muted-foreground">({formatCurrency(t.price)})</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pk-price">Package price (₹)</Label>
                <Input id="pk-price" type="number" min={0} value={packageForm.discountedPrice} onChange={(e) => setPackageForm({ ...packageForm, discountedPrice: Number(e.target.value) })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pk-turnaround">Report turnaround (hours)</Label>
                <Input id="pk-turnaround" type="number" min={1} value={packageForm.reportTurnaroundHours} onChange={(e) => setPackageForm({ ...packageForm, reportTurnaroundHours: Number(e.target.value) })} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPackageDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={savePackageMutation.isPending || packageForm.testIds.length === 0}>
                {editingPackage ? "Save changes" : "Create package"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletePackageTarget}
        onOpenChange={(open) => !open && setDeletePackageTarget(null)}
        title="Delete this package?"
        description={`"${deletePackageTarget?.name}" will be permanently removed. Packages with booking history can't be deleted — deactivate them instead.`}
        confirmLabel="Delete"
        destructive
        isLoading={deletePackageMutation.isPending}
        onConfirm={() => deletePackageTarget && deletePackageMutation.mutate(deletePackageTarget.id)}
      />
    </div>
  )
}
