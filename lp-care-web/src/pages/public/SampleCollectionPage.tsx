import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, Clock, MapPin, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { mockDelay } from "@/lib/utils"

// Backend-determined serviceability — this mock just simulates a couple
// of serviced pincodes so the flow can be exercised end-to-end.
const SERVICED_PINCODES = new Set(["752057", "751024", "751001", "751002"])

export function SampleCollectionPage() {
  const [pincode, setPincode] = useState("")
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<"AVAILABLE" | "UNAVAILABLE" | null>(null)

  async function handleCheck(e: FormEvent) {
    e.preventDefault()
    if (pincode.length !== 6) return
    setChecking(true)
    setResult(null)
    await mockDelay(600)
    setResult(SERVICED_PINCODES.has(pincode) ? "AVAILABLE" : "UNAVAILABLE")
    setChecking(false)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Sample Collection</h1>
        <p className="mt-3 text-muted-foreground">
          Choose home collection or visit our laboratory. Check whether home collection is
          available in your area below.
        </p>
      </div>

      <Card className="mt-10">
        <CardContent className="pt-6">
          <form onSubmit={handleCheck} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="pincode">Enter your pincode</Label>
              <Input
                id="pincode"
                inputMode="numeric"
                maxLength={6}
                placeholder="e.g. 752057"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <Button type="submit" disabled={pincode.length !== 6 || checking}>
              {checking ? "Checking…" : "Check availability"}
            </Button>
          </form>

          {result === "AVAILABLE" && (
            <div className="mt-5 flex items-start gap-3 rounded-lg bg-success/10 p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              <div>
                <p className="text-sm font-medium text-success">Home collection is available in your area</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Sign in to book a test and choose a collection slot that works for you.
                </p>
                <Button size="sm" className="mt-3" asChild>
                  <Link to="/login">Continue to booking</Link>
                </Button>
              </div>
            </div>
          )}
          {result === "UNAVAILABLE" && (
            <div className="mt-5 flex items-start gap-3 rounded-lg bg-destructive/10 p-4">
              <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Home collection isn't available here yet</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  You can still visit our laboratory for a sample collection — see the address below.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <MapPin className="size-6 text-primary" />
          <p className="mt-3 font-semibold">Laboratory address</p>
          <p className="mt-1 text-sm text-muted-foreground">HB Colony, Jemadai, Khordha, Odisha 752057</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <Clock className="size-6 text-primary" />
          <p className="mt-3 font-semibold">Working hours</p>
          <p className="mt-1 text-sm text-muted-foreground">Mon – Sat, 7:00 AM – 7:00 PM · Sun, 8:00 AM – 12:00 PM</p>
        </div>
      </div>
    </div>
  )
}
