export type CouponType = "FLAT" | "PERCENTAGE"

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  description: string
  minOrderAmount?: number
  expiresAt: string
  active: boolean
  usageCount: number
  usageLimit?: number
}
