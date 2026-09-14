export type ReferralType = "DOCTOR" | "OTHER"
export type CommissionType = "PERCENTAGE" | "FLAT"

export interface Referral {
  id: string
  name: string
  type: ReferralType
  phone?: string
  commissionType: CommissionType
  commissionValue: number
  active: boolean
  createdAt: string
  /** Sum of commission earned across every booking/bill this referral is credited on — always computed live. */
  totalEarned: number
  settledAmount: number
  balanceDue: number
}
