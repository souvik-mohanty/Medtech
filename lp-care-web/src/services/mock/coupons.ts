import type { Coupon } from "@/types"

export const mockCoupons: Coupon[] = [
  { id: "cp-1", code: "HEALTH10", type: "PERCENTAGE", value: 10, description: "10% off on all health packages", minOrderAmount: 1000, expiresAt: "2026-12-31T23:59:59Z", active: true, usageCount: 128, usageLimit: 500 },
  { id: "cp-2", code: "FLAT50", type: "FLAT", value: 50, description: "Flat ₹50 off on any booking", minOrderAmount: 300, expiresAt: "2026-10-31T23:59:59Z", active: true, usageCount: 340, usageLimit: 1000 },
  { id: "cp-3", code: "FIRST100", type: "FLAT", value: 100, description: "₹100 off on your first booking", expiresAt: "2026-12-31T23:59:59Z", active: true, usageCount: 89 },
  { id: "cp-4", code: "SUMMER20", type: "PERCENTAGE", value: 20, description: "20% off — summer health campaign", minOrderAmount: 1500, expiresAt: "2026-06-30T23:59:59Z", active: false, usageCount: 512, usageLimit: 500 },
]
