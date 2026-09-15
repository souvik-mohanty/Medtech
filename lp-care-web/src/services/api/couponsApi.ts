import { apiClient } from "@/lib/apiClient"
import { getFranchiseId } from "@/services/api/franchiseApi"
import type { Coupon, CouponType } from "@/types"

interface BackendCoupon {
  id: string
  code: string
  type: CouponType
  value: number
  description: string | null
  minOrderAmount: number | null
  expiresAt: string
  active: boolean
  usageLimit: number | null
  usageCount: number
}

function toCoupon(c: BackendCoupon): Coupon {
  return {
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    description: c.description ?? "",
    minOrderAmount: c.minOrderAmount ?? undefined,
    expiresAt: c.expiresAt,
    active: c.active,
    usageCount: c.usageCount,
    usageLimit: c.usageLimit ?? undefined,
  }
}

/** Owner-facing — every coupon for their own franchise. */
export async function getCoupons(): Promise<Coupon[]> {
  const response = await apiClient.get<{ data: BackendCoupon[] }>("/api/franchise/coupons")
  return response.data.data.map(toCoupon)
}

/** Checked (not yet redeemed) against the one franchise this deployment serves — see CouponService#redeem for the actual apply-at-checkout step. */
export async function validateCoupon(code: string, orderAmount: number): Promise<Coupon> {
  const franchiseId = await getFranchiseId()
  const response = await apiClient.get<{ data: BackendCoupon }>(`/api/patient/franchises/${franchiseId}/coupons/validate`, {
    params: { code, orderAmount },
  })
  return toCoupon(response.data.data)
}

export type CreateCouponInput = Omit<Coupon, "id" | "active" | "usageCount">

export async function createCoupon(input: CreateCouponInput): Promise<Coupon> {
  const response = await apiClient.post<{ data: BackendCoupon }>("/api/franchise/coupons", input)
  return toCoupon(response.data.data)
}

export async function toggleCouponActive(id: string): Promise<Coupon> {
  const response = await apiClient.patch<{ data: BackendCoupon }>(`/api/franchise/coupons/${id}/toggle-active`)
  return toCoupon(response.data.data)
}
