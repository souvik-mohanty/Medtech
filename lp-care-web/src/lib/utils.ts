import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** ₹ currency formatting used throughout patient/owner money displays. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

/** Simulates network latency for mock API services. */
export function mockDelay(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
