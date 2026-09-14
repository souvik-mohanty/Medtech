import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { getPatientSummaries } from "@/services/api/patientsApi"
import { formatDate } from "@/lib/utils"

const PAGE_SIZE = 8

export function OwnerPatientsPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["owner-patients", search, status],
    queryFn: () => getPatientSummaries({ search, status }),
  })

  const totalPages = Math.max(1, Math.ceil((data?.length ?? 0) / PAGE_SIZE))
  const pageItems = useMemo(() => (data ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [data, page])

  return (
    <div>
      <PageHeader title="Patients" description="Everyone who has registered or booked with your laboratory." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email…"
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingState rows={6} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No patients found" description="Try a different search term or filter." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Bookings</TableHead>
                  <TableHead>Last Booking</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.fullName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.phone}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.email ?? "—"}</TableCell>
                    <TableCell className="text-sm">{p.totalBookings}</TableCell>
                    <TableCell className="text-sm">{p.lastBookingDate ? formatDate(p.lastBookingDate) : "—"}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/owner/patients/${p.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="px-2 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
