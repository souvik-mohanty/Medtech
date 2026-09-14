import { Link } from "react-router-dom"
import { ClipboardCheck, FileText, Home, Stethoscope, TestTube, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const SERVICES = [
  {
    icon: TestTube,
    title: "Individual Pathology Tests",
    description: "Book any single test — blood, urine, hormone, diabetes, thyroid, and more — with transparent pricing and preparation instructions upfront.",
    link: "/tests",
    linkLabel: "Browse tests",
  },
  {
    icon: ClipboardCheck,
    title: "Health Packages",
    description: "Curated bundles of related tests at a discounted price, ideal for routine checkups, diabetes monitoring, or full-body wellness screening.",
    link: "/packages",
    linkLabel: "Browse packages",
  },
  {
    icon: Truck,
    title: "Home Sample Collection",
    description: "A trained phlebotomist visits your address at a slot you choose. A flat collection charge applies, shown clearly before you pay.",
    link: "/sample-collection",
    linkLabel: "Check availability",
  },
  {
    icon: Home,
    title: "Lab Visit",
    description: "Prefer to visit us? Walk in during working hours and get your sample collected on the spot — no collection charge for lab visits.",
    link: "/contact",
    linkLabel: "Get directions",
  },
  {
    icon: FileText,
    title: "Digital Reports & Invoices",
    description: "Once your report is ready, download it securely from your account, along with a GST-compliant invoice for every booking.",
    link: "/login",
    linkLabel: "Access your account",
  },
  {
    icon: Stethoscope,
    title: "Prescription Uploads",
    description: "Some tests require a doctor's prescription — upload it during booking and we'll verify it before your sample is processed.",
    link: "/tests",
    linkLabel: "See requirements",
  },
]

export function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Our Services</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Everything you need for pathology testing, from a single test to a full health package.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => (
          <Card key={s.title} className="flex flex-col">
            <CardHeader>
              <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="size-5 text-primary" />
              </div>
              <CardTitle className="mt-3">{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="flex-1 text-sm text-muted-foreground">{s.description}</p>
              <Button variant="outline" className="mt-4 w-fit" asChild>
                <Link to={s.link}>{s.linkLabel}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
