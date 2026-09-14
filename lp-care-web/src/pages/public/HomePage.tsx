import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ClipboardCheck,
  Home as HomeIcon,
  MapPin,
  Phone,
  ShieldCheck,
  Stethoscope,
  Timer,
  TestTube,
  Truck,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getPackages, getTests } from "@/services/api/testsApi"
import { formatCurrency } from "@/lib/utils"

const SERVICES = [
  { icon: TestTube, title: "Pathology Tests", description: "A wide range of blood, urine, hormone, and organ-function tests." },
  { icon: ClipboardCheck, title: "Health Packages", description: "Curated bundles for routine checkups, diabetes care, and more." },
  { icon: Truck, title: "Home Sample Collection", description: "A trained phlebotomist visits your home at a slot you choose." },
  { icon: Stethoscope, title: "Lab Visit", description: "Walk in to our laboratory for sample collection any working day." },
]

const STEPS = [
  { icon: TestTube, title: "Choose a test or package", description: "Search or browse by category and add what you need." },
  { icon: HomeIcon, title: "Pick a collection method", description: "Home collection or a lab visit — whichever suits you." },
  { icon: Timer, title: "Select a convenient slot", description: "Choose a date and time that works for you." },
  { icon: ClipboardCheck, title: "Get your report online", description: "Download your report the moment it's ready." },
]

const WHY_US = [
  { icon: ShieldCheck, title: "Accurate & Confidential", description: "Your samples and reports are handled with strict privacy." },
  { icon: UserCheck, title: "Trained Professionals", description: "Experienced technicians for both home and lab collection." },
  { icon: Timer, title: "Timely Reports", description: "Clear turnaround times shown upfront for every test." },
]

export function HomePage() {
  const { data: tests } = useQuery({ queryKey: ["tests", "popular"], queryFn: () => getTests() })
  const { data: packages } = useQuery({ queryKey: ["packages", "home"], queryFn: getPackages })

  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <div>
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">
              LP Care Pathology
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
              Reliable Diagnostics. Better Healthcare.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Book pathology tests, schedule sample collection, and access your laboratory reports
              from one convenient platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/tests">Book a Test</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/packages">Explore Test Packages</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" /> HB Colony, Jemadai, Khordha
              </span>
              <span className="flex items-center gap-2">
                <Phone className="size-4 text-primary" /> +91 99999 00000
              </span>
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-md rounded-3xl border bg-card p-8 shadow-sm">
            <div className="grid h-full grid-cols-2 gap-4">
              <div className="flex flex-col justify-center gap-1 rounded-2xl bg-primary/5 p-4">
                <TestTube className="size-7 text-primary" />
                <p className="mt-2 text-2xl font-bold">15+</p>
                <p className="text-xs text-muted-foreground">Pathology tests</p>
              </div>
              <div className="flex flex-col justify-center gap-1 rounded-2xl bg-secondary/10 p-4">
                <Truck className="size-7 text-secondary" />
                <p className="mt-2 text-2xl font-bold">Home</p>
                <p className="text-xs text-muted-foreground">Sample collection</p>
              </div>
              <div className="flex flex-col justify-center gap-1 rounded-2xl bg-secondary/10 p-4">
                <Timer className="size-7 text-secondary" />
                <p className="mt-2 text-2xl font-bold">Fast</p>
                <p className="text-xs text-muted-foreground">Report turnaround</p>
              </div>
              <div className="flex flex-col justify-center gap-1 rounded-2xl bg-primary/5 p-4">
                <ShieldCheck className="size-7 text-primary" />
                <p className="mt-2 text-2xl font-bold">Secure</p>
                <p className="text-xs text-muted-foreground">Report access</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services overview */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">What we offer</h2>
          <p className="mt-3 text-muted-foreground">Everything you need for your diagnostic care, in one place.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <Card key={s.title}>
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="size-5 text-primary" />
                </div>
                <CardTitle className="mt-3 text-base">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{s.description}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Popular tests */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Popular diagnostic tests</h2>
              <p className="mt-2 text-muted-foreground">Frequently booked tests by our patients.</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/tests">View all tests</Link>
            </Button>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(tests ?? []).slice(0, 8).map((test) => (
              <Card key={test.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <Badge variant="secondary" className="w-fit text-xs">{test.category.replace(/_/g, " ")}</Badge>
                  <CardTitle className="text-base">{test.name}</CardTitle>
                </CardHeader>
                <CardContent className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-lg font-bold">{formatCurrency(test.price)}</span>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/tests/${test.id}`}>View</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Health packages */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Health packages</h2>
            <p className="mt-2 text-muted-foreground">Bundled tests at a better price for routine wellness checks.</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/packages">View all packages</Link>
          </Button>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(packages ?? []).slice(0, 3).map((pkg) => (
            <Card key={pkg.id}>
              <CardHeader>
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{pkg.tests.length} tests included</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{pkg.description}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xl font-bold">{formatCurrency(pkg.discountedPrice)}</span>
                  <span className="text-sm text-muted-foreground line-through">{formatCurrency(pkg.totalPrice)}</span>
                </div>
                <Button className="mt-4 w-full" asChild>
                  <Link to={`/packages/${pkg.id}`}>View package</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Home collection */}
      <section className="border-y bg-secondary/5">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <Badge variant="outline" className="mb-3 border-secondary/30 bg-secondary/10 text-secondary">
              Home Sample Collection
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">We come to you</h2>
            <p className="mt-4 text-muted-foreground">
              Skip the trip to the lab. Choose home collection at checkout, pick an address and a
              convenient slot, and a trained phlebotomist will visit you at the scheduled time.
            </p>
            <Button className="mt-6" asChild>
              <Link to="/sample-collection">Check availability</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Choose your slot", icon: Timer },
              { label: "Verified collectors", icon: UserCheck },
              { label: "Safe & hygienic kits", icon: ShieldCheck },
              { label: "Doorstep convenience", icon: HomeIcon },
            ].map((f) => (
              <div key={f.label} className="rounded-xl border bg-card p-5">
                <f.icon className="size-6 text-secondary" />
                <p className="mt-3 text-sm font-medium">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <p className="mt-3 text-muted-foreground">Booking a test takes less than five minutes.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative rounded-xl border bg-card p-5">
              <span className="text-xs font-semibold text-primary">STEP {i + 1}</span>
              <step.icon className="mt-3 size-6 text-primary" />
              <p className="mt-3 font-medium">{step.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why choose us */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Why choose our laboratory</h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {WHY_US.map((w) => (
              <div key={w.title} className="rounded-xl border bg-card p-6 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <w.icon className="size-6 text-primary" />
                </div>
                <p className="mt-4 font-semibold">{w.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{w.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-16">
          <h2 className="text-3xl font-bold tracking-tight">Ready to book your test?</h2>
          <p className="max-w-lg text-primary-foreground/90">
            Create an account in seconds and get access to test booking, reports, and invoices.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
