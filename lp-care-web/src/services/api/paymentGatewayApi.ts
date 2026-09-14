import { mockDelay } from "@/lib/utils"
import type { PaymentGatewayConfig, PaymentGatewayProvider } from "@/types"

/**
 * Mock payment gateway config — mirrors the medtech backend's
 * franchise/payment-gateway module: each owner brings their own
 * Razorpay/PhonePe API key + secret, the secret is never returned once
 * saved (only a masked form), and online payment only works once a gateway
 * is configured and active (see Franchise#hasActivePaymentGateway()).
 * No real credentials are ever sent or stored anywhere in this demo.
 *
 * There's no backend here, so nothing is actually shared between the owner
 * and patient "sides" of a demo — persisted to localStorage (like
 * authStore's session) purely so the setting survives a reload and is
 * visible across tabs on the same browser, which is what makes the
 * owner-configures / patient-sees-it flow demonstrable at all.
 */
const STORAGE_KEY = "lp-care-payment-gateway"

function readConfig(): PaymentGatewayConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PaymentGatewayConfig) : null
  } catch {
    return null
  }
}

function writeConfig(value: PaymentGatewayConfig | null) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Private browsing / storage disabled — config just won't survive a reload.
  }
}

export async function getPaymentGatewayConfig(): Promise<PaymentGatewayConfig | null> {
  await mockDelay(400)
  return readConfig()
}

export interface SavePaymentGatewayInput {
  provider: PaymentGatewayProvider
  apiKey: string
  apiSecret: string
}

function maskSecret(secret: string): string {
  const tail = secret.slice(-4).padStart(4, "•")
  return `•••• •••• •••• ${tail}`
}

export async function savePaymentGatewayConfig(input: SavePaymentGatewayInput): Promise<PaymentGatewayConfig> {
  await mockDelay(700)
  const config: PaymentGatewayConfig = {
    provider: input.provider,
    apiKey: input.apiKey,
    maskedSecret: maskSecret(input.apiSecret),
    active: true,
    updatedAt: new Date().toISOString(),
  }
  writeConfig(config)
  return config
}

export async function removePaymentGatewayConfig(): Promise<void> {
  await mockDelay(400)
  writeConfig(null)
}
