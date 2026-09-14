import { cn } from "@/lib/utils"

/**
 * Hand-drawn recreation of the LP Care Pathology mark (blood-drop + caring
 * hand inside a blue/green swirl) — the uploaded PNG logos aren't available
 * as project assets, so this SVG stands in for them. Swap the <LogoMark>
 * internals for an <img src="/logo.png"> once the real files are added to
 * `public/`.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("size-9", className)} aria-hidden="true">
      <circle cx="50" cy="50" r="42" fill="none" stroke="#16a34a" strokeWidth="7" strokeLinecap="round" strokeDasharray="200 264" strokeDashoffset="-18" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#1d4ed8" strokeWidth="7" strokeLinecap="round" strokeDasharray="160 214" strokeDashoffset="70" />
      <path d="M50 30c7 9 12 15.5 12 21.5A12 12 0 0 1 38 51.5C38 45.5 43 39 50 30Z" fill="#e11d2e" />
      <path d="M46.5 44.5h7v14h-7z" fill="#fff" />
      <path d="M43 48h14v7H43z" fill="#fff" />
      <path d="M28 66c4-6 10-9 16-9 5 0 9 2 13 5 5-1 10-3 13-6 2 2 1 5-1 6-4 4-11 8-18 8-9 0-17-1-23-4Z" fill="#22c55e" />
    </svg>
  )
}

export function Logo({
  className,
  iconClassName,
  dark = false,
}: {
  className?: string
  iconClassName?: string
  /** Use on a dark sidebar/header background instead of the light default. */
  dark?: boolean
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={iconClassName} />
      <span className="flex flex-col leading-tight">
        <span className="text-base font-extrabold tracking-tight">
          <span className={dark ? "text-sky-300" : "text-primary"}>LP CARE</span>{" "}
          <span className={dark ? "text-emerald-300" : "text-secondary"}>PATHOLOGY</span>
        </span>
        <span className={cn("text-[11px] font-medium", dark ? "text-white/60" : "text-muted-foreground")}>
          Our test is your trust
        </span>
      </span>
    </span>
  )
}
