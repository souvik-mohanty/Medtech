import { useState } from "react"
import { Link, NavLink, Outlet } from "react-router-dom"
import { Menu, Phone, Mail, MapPin } from "lucide-react"
import { Logo } from "@/components/common/Logo"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/services", label: "Services" },
  { to: "/tests", label: "Pathology Tests" },
  { to: "/packages", label: "Test Packages" },
  { to: "/sample-collection", label: "Sample Collection" },
  { to: "/contact", label: "Contact Us" },
]

function HeaderNavLink({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "text-sm font-medium transition-colors hover:text-primary",
          isActive ? "text-primary" : "text-foreground/70",
        )
      }
    >
      {label}
    </NavLink>
  )
}

export function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((link) => (
              <HeaderNavLink key={link.to} {...link} />
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Register</Link>
            </Button>
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="mt-8 flex flex-col gap-5 px-1">
                {NAV_LINKS.map((link) => (
                  <HeaderNavLink key={link.to} {...link} onClick={() => setMobileOpen(false)} />
                ))}
                <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                  <Button variant="outline" asChild onClick={() => setMobileOpen(false)}>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild onClick={() => setMobileOpen(false)}>
                    <Link to="/register">Register</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              A modern, reliable, and patient-friendly pathology laboratory platform — book tests,
              schedule sample collection, and access your reports in one place.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Quick Links</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {NAV_LINKS.slice(0, 5).map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Account</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/login" className="hover:text-primary">Login</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-primary">Register</Link>
              </li>
              <li>
                <Link to="/patient/bookings" className="hover:text-primary">My Bookings</Link>
              </li>
              <li>
                <Link to="/patient/reports" className="hover:text-primary">Laboratory Reports</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>HB Colony, Jemadai, Khordha, Odisha 752057</span>
              </li>
              <li className="flex gap-2.5">
                <Phone className="size-4 shrink-0 text-primary" />
                <span>+91 99999 00000</span>
              </li>
              <li className="flex gap-2.5">
                <Mail className="size-4 shrink-0 text-primary" />
                <span>care@lpcarepathology.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} LP Care Pathology. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
