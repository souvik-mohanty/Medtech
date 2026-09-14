import { apiClient } from "@/lib/apiClient"
import type { CommissionType, Referral, ReferralType } from "@/types"

interface BackendReferral {
  id: string
  name: string
  type: ReferralType
  phone: string | null
  commissionType: CommissionType
  commissionValue: number
  active: boolean
  createdAt: string
  totalEarned: number
  settledAmount: number
  balanceDue: number
}

function toReferral(r: BackendReferral): Referral {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    phone: r.phone ?? undefined,
    commissionType: r.commissionType,
    commissionValue: r.commissionValue,
    active: r.active,
    createdAt: r.createdAt,
    totalEarned: r.totalEarned,
    settledAmount: r.settledAmount,
    balanceDue: r.balanceDue,
  }
}

export async function getReferrals(): Promise<Referral[]> {
  const response = await apiClient.get<{ data: BackendReferral[] }>("/api/franchise/referrals")
  return response.data.data.map(toReferral)
}

export type ReferralInput = Omit<Referral, "id" | "active" | "createdAt" | "totalEarned" | "settledAmount" | "balanceDue">

export async function createReferral(input: ReferralInput): Promise<Referral> {
  const response = await apiClient.post<{ data: BackendReferral }>("/api/franchise/referrals", input)
  return toReferral(response.data.data)
}

export async function updateReferral(id: string, input: ReferralInput): Promise<Referral> {
  const response = await apiClient.put<{ data: BackendReferral }>(`/api/franchise/referrals/${id}`, input)
  return toReferral(response.data.data)
}

export async function toggleReferralActive(id: string): Promise<Referral> {
  const response = await apiClient.patch<{ data: BackendReferral }>(`/api/franchise/referrals/${id}/toggle-active`)
  return toReferral(response.data.data)
}

/** Records a commission payout to this referral, on top of whatever's already been settled. */
export async function settleReferral(id: string, amount: number): Promise<Referral> {
  const response = await apiClient.patch<{ data: BackendReferral }>(`/api/franchise/referrals/${id}/settle`, { amount })
  return toReferral(response.data.data)
}
