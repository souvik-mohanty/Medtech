export type PaymentGatewayProvider = "RAZORPAY" | "PHONEPE"

export interface PaymentGatewayConfig {
  provider: PaymentGatewayProvider
  /** Masked, e.g. "****ab12" — the real key secret is never returned by the backend at all, see CredentialEncryptionService. */
  maskedApiKey: string
  active: boolean
}
