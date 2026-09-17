import { apiClient } from "@/lib/apiClient"
import type { PaymentGatewayConfig, PaymentGatewayProvider } from "@/types"

interface BackendPaymentGatewayResponse {
  provider: PaymentGatewayProvider | "NONE"
  maskedApiKey: string | null
  configured: boolean
  active: boolean
}

function toConfig(r: BackendPaymentGatewayResponse): PaymentGatewayConfig | null {
  if (!r.configured || r.provider === "NONE") return null
  return {
    provider: r.provider,
    maskedApiKey: r.maskedApiKey ?? "",
    active: r.active,
  }
}

export async function getPaymentGatewayConfig(): Promise<PaymentGatewayConfig | null> {
  const response = await apiClient.get<{ data: BackendPaymentGatewayResponse }>("/api/franchise/payment-gateway")
  return toConfig(response.data.data)
}

export interface SavePaymentGatewayInput {
  provider: PaymentGatewayProvider
  apiKey: string
  apiSecret: string
}

export async function savePaymentGatewayConfig(input: SavePaymentGatewayInput): Promise<PaymentGatewayConfig | null> {
  const response = await apiClient.put<{ data: BackendPaymentGatewayResponse }>("/api/franchise/payment-gateway", input)
  return toConfig(response.data.data)
}

export async function removePaymentGatewayConfig(): Promise<void> {
  await apiClient.delete("/api/franchise/payment-gateway")
}
