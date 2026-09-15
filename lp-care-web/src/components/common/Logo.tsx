import { cn } from "@/lib/utils"

/**
 * Hand-drawn recreation of the LP Care Pathology mark (blood-drop + caring
 * hand inside an interleaved blue/green double-swirl) — a pasted reference
 * image isn't something Claude's tools can extract raw bytes from and save
 * as a project asset, so this SVG is a close redraw instead. Swap the
 * <LogoMark> internals for an <img src="/logo.png"> if a real exported file
 * is ever added to `public/`.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("size-9", className)} aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="#16a34a"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="150 36 68 22"
        strokeDashoffset="-20"
      />
      <circle
        cx="50"
        cy="50"
        r="36"
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="120 30 55 21"
        strokeDashoffset="60"
      />
      <path d="M50 28c7.5 9.5 13 16.5 13 23A13 13 0 0 1 37 51C37 44.5 42.5 37.5 50 28Z" fill="#e11d2e" />
      <path d="M46.5 43.5h7v15h-7z" fill="#fff" />
      <path d="M42.5 47.5h15v7h-15z" fill="#fff" />
      <path d="M27 67c4-6.5 10.5-10 16.5-10 5 0 9.5 2 13.5 5.5 5-1 10.5-3.5 14-7 2.5 2 1.5 5.5-0.5 7-4.5 4.5-11.5 8.5-19 8.5-9 0-17.5-1-24.5-4Z" fill="#22c55e" />
      <path d="M45 70.5c6-3 12-3.5 16.5-7.5" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
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
