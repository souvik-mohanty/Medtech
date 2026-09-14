import { Award, HeartPulse, ShieldCheck, Users } from "lucide-react"

const VALUES = [
  { icon: ShieldCheck, title: "Accuracy first", description: "Every sample is handled with strict quality checks at each step." },
  { icon: HeartPulse, title: "Patient-friendly", description: "Clear pricing, simple booking, and reports you can actually understand." },
  { icon: Users, title: "Community-focused", description: "Serving patients across Khordha and nearby areas with home collection." },
  { icon: Award, title: "Experienced team", description: "Our technicians and staff bring years of diagnostic laboratory experience." },
]

export function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">About LP Care Pathology</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          LP Care Pathology is a local diagnostic laboratory dedicated to making pathology testing
          simple, transparent, and accessible — whether you visit us or we come to you.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Our mission</h2>
          <p className="mt-3 text-muted-foreground">
            We believe getting a diagnostic test shouldn't be complicated. From booking to
            collection to report delivery, every step of the LP Care Pathology experience is
            designed around the patient — clear information, fair pricing, and no unnecessary
            waiting.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">What we do</h2>
          <p className="mt-3 text-muted-foreground">
            We offer a wide range of pathology tests and health packages, with both home sample
            collection and in-lab visits. Every booking is tracked from confirmation through to
            report delivery, so you always know where things stand.
          </p>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-center text-2xl font-bold">What we stand for</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-xl border bg-card p-6 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
                <v.icon className="size-6 text-primary" />
              </div>
              <p className="mt-4 font-semibold">{v.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{v.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
