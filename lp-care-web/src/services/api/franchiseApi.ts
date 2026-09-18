import { apiClient } from "@/lib/apiClient"

/** Only the fields every franchise-scoped call currently needs. */
export interface FranchiseSummary {
  id: string
  name: string
  /** Empty = no restriction configured, every pincode is servable. */
  serviceablePincodes: string[]
  /** Whether the owner has an active Razorpay/PhonePe connection — never the secret, that stays owner-only. */
  hasActivePaymentGateway: boolean
  /** Razorpay's Key ID, safe to embed client-side (like a Stripe publishable key) — what Checkout.js needs to open. Null unless the active gateway is Razorpay. */
  razorpayKeyId: string | null
}

export interface FranchiseProfile {
  id: string
  name: string
  gstin: string | null
  contactPhone: string | null
  contactEmail: string | null
  logoUrl: string | null
  accentColorHex: string
  invoiceFont: "DEFAULT" | "SERIF" | "MONOSPACE"
  invoiceHeaderNote: string | null
  invoiceFooterNote: string | null
  invoicePrefix: string | null
  /** Charged on HOME_COLLECTION bookings below freeCollectionMinOrder (or always, if that's unset). */
  collectionCharge: number
  /** Subtotal at/above which the collection charge is waived. Null = no threshold, always charge. */
  freeCollectionMinOrder: number | null
  /** Empty = no restriction configured, every pincode is servable. */
  serviceablePincodes: string[]
}

export type FranchiseProfileUpdate = Omit<FranchiseProfile, "id">

/** The owner's own franchise profile — resolved from the caller's auth, not a path variable. */
export async function getFranchiseProfile(): Promise<FranchiseProfile> {
  const response = await apiClient.get<{ data: FranchiseProfile }>("/api/franchise/profile")
  return response.data.data
}

export async function updateFranchiseProfile(update: FranchiseProfileUpdate): Promise<FranchiseProfile> {
  const response = await apiClient.put<{ data: FranchiseProfile }>("/api/franchise/profile", update)
  return response.data.data
}

/**
 * Patient-facing "which shop(s) can I use" lookup. Only one lab exists in
 * this deployment — same "just use the first result" convention the old
 * medtech web/ app used, kept a list (not a single object) so a second
 * franchise added later needs no API shape change.
 */
export async function getFranchises(): Promise<FranchiseSummary[]> {
  const response = await apiClient.get<{ data: FranchiseSummary[] }>("/api/patient/franchises")
  return response.data.data
}

let cachedFranchiseIdPromise: Promise<string> | null = null

/**
 * Memoized for the life of the page load — every franchise-scoped call
 * (tests, packages, bookings, payments) needs this id, and it never
 * changes within a session, so there's no reason to refetch it every time.
 */
export function getFranchiseId(): Promise<string> {
  if (!cachedFranchiseIdPromise) {
    cachedFranchiseIdPromise = getFranchises().then((franchises) => {
      const first = franchises[0]
      if (!first) throw new Error("No lab is available right now.")
      return first.id
    })
  }
  return cachedFranchiseIdPromise
}

/** For validating an address's pincode client-side before submitting it. Empty = no restriction configured. */
export async function getServiceablePincodes(): Promise<string[]> {
  const franchises = await getFranchises()
  return franchises[0]?.serviceablePincodes ?? []
}

export interface PaymentGatewayInfo {
  hasActivePaymentGateway: boolean
  /** What Checkout.js needs to open — null unless the active gateway is Razorpay. */
  razorpayKeyId: string | null
}

/**
 * Whether the lab has online payment set up, and the (public, safe to
 * embed) Razorpay key to open Checkout.js with — patients only ever get
 * this, never the secret, which stays owner-only behind
 * /api/franchise/payment-gateway (a patient's token can't call that path
 * at all — it requires the FRANCHISE role). Not memoized like
 * getFranchiseId, since this genuinely can change mid-session if the owner
 * connects/disconnects a gateway — left to the caller's own useQuery to
 * cache/refresh.
 */
export async function getPaymentGatewayInfo(): Promise<PaymentGatewayInfo> {
  const franchises = await getFranchises()
  const first = franchises[0]
  return {
    hasActivePaymentGateway: first?.hasActivePaymentGateway ?? false,
    razorpayKeyId: first?.razorpayKeyId ?? null,
  }
}
