import { mockDelay } from "@/lib/utils"
import { mockAnalytics } from "@/services/mock/analytics"
import type { OwnerAnalytics } from "@/types"

export async function getOwnerAnalytics(): Promise<OwnerAnalytics> {
  await mockDelay(400)
  return mockAnalytics
}
