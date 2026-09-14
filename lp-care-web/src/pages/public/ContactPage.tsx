import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Clock, Mail, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { mockDelay } from "@/lib/utils"

export function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    await mockDelay(700)
    setIsSubmitting(false)
    toast.success("Message sent — we'll get back to you shortly.")
    e.currentTarget.reset()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Have a question about a test, booking, or report? Reach out and our team will help.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <div className="flex items-start gap-4 rounded-xl border bg-card p-5">
            <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Laboratory address</p>
              <p className="text-sm text-muted-foreground">HB Colony, Jemadai, Khordha, Odisha 752057</p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-xl border bg-card p-5">
            <Phone className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Phone</p>
              <p className="text-sm text-muted-foreground">+91 99999 00000</p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-xl border bg-card p-5">
            <Mail className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">care@lpcarepathology.in</p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-xl border bg-card p-5">
            <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Working hours</p>
              <p className="text-sm text-muted-foreground">Mon – Sat, 7:00 AM – 7:00 PM · Sun, 8:00 AM – 12:00 PM</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" required placeholder="+91 90000 00000" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email (optional)</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" required rows={5} placeholder="How can we help?" />
          </div>
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? "Sending…" : "Send message"}
          </Button>
        </form>
      </div>
    </div>
  )
}
