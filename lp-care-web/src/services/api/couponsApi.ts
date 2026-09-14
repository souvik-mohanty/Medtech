import { mockDelay } from "@/lib/utils"
import { mockCoupons } from "@/services/mock/coupons"
import type { Coupon } from "@/types"

let coupons: Coupon[] = structuredClone(mockCoupons)

export async function getCoupons(): Promise<Coupon[]> {
  await mockDelay()
  return coupons
}

/** The backend is authoritative on validity/value — this mirrors that check for the demo flow. */
export async function validateCoupon(code: string, orderAmount: number): Promise<Coupon> {
  await mockDelay(500)
  const coupon = coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase())
  if (!coupon) throw new Error("This coupon code doesn't exist.")
  if (!coupon.active) throw new Error("This coupon has expired.")
  if (new Date(coupon.expiresAt) < new Date()) throw new Error("This coupon has expired.")
  if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
    throw new Error(`This coupon requires a minimum order of ₹${coupon.minOrderAmount}.`)
  }
  return coupon
}

export type CreateCouponInput = Omit<Coupon, "id" | "active" | "usageCount">

export async function createCoupon(input: CreateCouponInput): Promise<Coupon> {
  await mockDelay(600)
  const coupon: Coupon = { ...input, id: `cp-${Date.now()}`, active: true, usageCount: 0 }
  coupons = [coupon, ...coupons]
  return coupon
}

export async function toggleCouponActive(id: string): Promise<Coupon> {
  await mockDelay(400)
  coupons = coupons.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
  const updated = coupons.find((c) => c.id === id)
  if (!updated) throw new Error("Coupon not found")
  return updated
}
