import { useState, type ReactNode } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import { Bell, LogOut, Menu, Settings, User as UserIcon } from "lucide-react"
import { Logo } from "@/components/common/Logo"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { useAuthStore } from "@/app/store/authStore"
import { cn } from "@/lib/utils"

export interface DashboardNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

interface DashboardShellProps {
  navItems: DashboardNavItem[]
  portalLabel: string
  settingsPath: string
  notificationsPath: string
  unreadNotifications?: number
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

function NavLinks({ items, onNavigate }: { items: DashboardNavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )
          }
        >
          <item.icon className="size-4 shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

function SidebarContent({ items }: { items: DashboardNavItem[] }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Logo dark />
      </div>
      <NavLinks items={items} />
    </div>
  )
}

export function DashboardShell({ navItems, portalLabel, settingsPath, notificationsPath, unreadNotifications = 0 }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const clearSession = useAuthStore((s) => s.clearSession)

  function handleLogout() {
    clearSession()
    navigate("/login")
  }

  const name = session?.user.fullName || "User"

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed h-screen w-64">
          <SidebarContent items={navItems} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="lg:hidden">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarContent items={navItems} />
              </SheetContent>
            </Sheet>
            <span className="hidden text-sm font-semibold text-muted-foreground sm:inline">{portalLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" className="relative" onClick={() => navigate(notificationsPath)}>
              <Bell className="size-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                  {unreadNotifications}
                </span>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials(name)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">{name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs font-normal text-muted-foreground">{session?.user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(settingsPath)}>
                  <UserIcon /> Profile & Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLogoutOpen(true)} variant="destructive">
                  <LogOut /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Log out?"
        description="You'll need to sign in with Google again to continue."
        confirmLabel="Log out"
        destructive
        onConfirm={handleLogout}
      />
    </div>
  )
}

export function DashboardSectionCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border bg-card p-5 shadow-sm", className)}>{children}</div>
}

export { Settings as SettingsIcon }
