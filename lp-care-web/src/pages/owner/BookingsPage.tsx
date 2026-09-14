import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Ban, Eye, IndianRupee, Loader2, Search, Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { cancelBooking, getOwnerBookings, recordPayment, updateCollectionStatus } from "@/services/api/bookingsApi"
import { uploadLabReport, viewOwnerReport } from "@/services/api/labReportApi"
import { errorMessage } from "@/lib/apiClient"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Booking, BookingStatus, CollectionStatus } from "@/types"

const COLLECTION_STEPS: CollectionStatus[] = ["SCHEDULED", "ASSIGNED", "SAMPLE_COLLECTED", "PROCESSING", "COMPLETED"]

export function OwnerBookingsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<BookingStatus | "ALL">("ALL")
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)
  const [paymentTarget, setPaymentTarget] = useState<Booking | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [viewingReportId, setViewingReportId] = useState<string | null>(null)
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["owner-bookings", search, status],
    queryFn: () => getOwnerBookings({ search, status }),
  })

  const collectionMutation = useMutation({
    mutationFn: ({ id, collectionStatus }: { id: string; collectionStatus: CollectionStatus }) =>
      updateCollectionStatus(id, collectionStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      toast.success("Booking status updated")
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      toast.success("Booking cancelled")
      setCancelTarget(null)
    },
  })

  const paymentMutation = useMutation({
    mutationFn: () => recordPayment(paymentTarget!.id, Number(paymentAmount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      toast.success("Payment recorded")
      setPaymentTarget(null)
      setPaymentAmount("")
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const uploadReportMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadLabReport(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] })
      toast.success("Report uploaded")
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  async function handleViewReport(id: string) {
    setViewingReportId(id)
    try {
      await viewOwnerReport(id)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setViewingReportId(null)
    }
  }

  return (
    <div>
      <PageHeader title="Bookings" description="Search, filter, and manage every booking's status." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by booking ID or patient…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PENDING_PAYMENT">Pending Payment</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="SAMPLE_COLLECTION_SCHEDULED">Collection Scheduled</SelectItem>
            <SelectItem value="SAMPLE_COLLECTED">Sample Collected</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="REPORT_READY">Report Ready</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingState rows={6} />
      ) : !bookings || bookings.length === 0 ? (
        <EmptyState title="No bookings found" />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Collection stage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Report</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => {
                const cancelled = b.collectionStatus === "CANCELLED"
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <p className="font-medium">{b.packageName ?? b.items.map((i) => i.testName).join(", ")}</p>
                      <p className="text-xs text-muted-foreground">#{b.id}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {b.forFamilyMemberName ?? b.patientName}
                      {b.source === "FRANCHISE_COUNTER" && <Badge variant="secondary" className="ml-2 text-[10px]">Walk-in</Badge>}
                      {b.referralName && <p className="mt-0.5 text-xs text-muted-foreground">Ref: {b.referralName}</p>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {b.phone && <p>{b.phone}</p>}
                      {b.collectionMethod === "HOME_COLLECTION" && b.addressLine1 && (
                        <p className="mt-0.5 max-w-48">
                          {b.addressLine1}{b.addressLine2 ? `, ${b.addressLine2}` : ""}, {b.addressCity}, {b.addressState} – {b.addressPincode}
                        </p>
                      )}
                      {!b.phone && !(b.collectionMethod === "HOME_COLLECTION" && b.addressLine1) && "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(b.collectionDate)}</TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(b.totalAmount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={b.paymentStatus} />
                        {(b.paymentStatus === "PENDING" || b.paymentStatus === "PARTIALLY_PAID") && (
                          <Button size="icon-sm" variant="ghost" title="Record payment" onClick={() => { setPaymentTarget(b); setPaymentAmount("") }}>
                            <IndianRupee className="size-3.5" />
                          </Button>
                        )}
                      </div>
                      {(b.paymentStatus === "PARTIALLY_PAID" || b.paymentStatus === "PENDING") && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatCurrency(b.amountPaid)} paid · Pending {formatCurrency(b.totalAmount - b.amountPaid)}
                        </p>
                      )}
                      {b.paymentHistory.length > 0 && (
                        <div className="mt-1 space-y-0.5 border-l-2 border-muted pl-2">
                          {b.paymentHistory.map((h, i) => (
                            <p key={i} className="text-[11px] text-muted-foreground">
                              {formatCurrency(h.amount)} on {formatDate(h.recordedAt)}
                            </p>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={b.collectionStatus}
                        disabled={cancelled}
                        onValueChange={(v) => collectionMutation.mutate({ id: b.id, collectionStatus: v as CollectionStatus })}
                      >
                        <SelectTrigger className="w-44" size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLLECTION_STEPS.filter((s) => s !== "ASSIGNED" || b.collectionMethod === "HOME_COLLECTION").map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.split("_").map((w) => w[0] + w.slice(1).toLowerCase()).join(" ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><StatusBadge status={b.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {b.hasReport && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title={b.reportExpiresAt ? `View report (auto-deleted ${formatDate(b.reportExpiresAt)})` : "View report"}
                            disabled={viewingReportId === b.id}
                            onClick={() => handleViewReport(b.id)}
                          >
                            {viewingReportId === b.id ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
                          </Button>
                        )}
                        <input
                          ref={(el) => { fileInputs.current[b.id] = el }}
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) uploadReportMutation.mutate({ id: b.id, file })
                            e.target.value = ""
                          }}
                        />
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title={b.hasReport ? "Replace report" : "Upload report"}
                          disabled={uploadReportMutation.isPending && uploadReportMutation.variables?.id === b.id}
                          onClick={() => fileInputs.current[b.id]?.click()}
                        >
                          {uploadReportMutation.isPending && uploadReportMutation.variables?.id === b.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Upload className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="icon-sm" variant="ghost" disabled={cancelled} onClick={() => setCancelTarget(b.id)}>
                        <Ban className="size-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancel this booking?"
        description="The patient will be notified. This cannot be undone in the demo."
        confirmLabel="Cancel booking"
        destructive
        isLoading={cancelMutation.isPending}
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget)}
      />

      <Dialog open={!!paymentTarget} onOpenChange={(open) => !open && setPaymentTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
          </DialogHeader>
          {paymentTarget && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                paymentMutation.mutate()
              }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                {formatCurrency(paymentTarget.amountPaid)} of {formatCurrency(paymentTarget.totalAmount)} collected so far.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="pay-amount">Amount received now</Label>
                <Input
                  id="pay-amount"
                  type="number"
                  min={1}
                  max={paymentTarget.totalAmount - paymentTarget.amountPaid}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPaymentTarget(null)}>Cancel</Button>
                <Button type="submit" disabled={paymentMutation.isPending || !paymentAmount || Number(paymentAmount) <= 0}>
                  {paymentMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  Record payment
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
