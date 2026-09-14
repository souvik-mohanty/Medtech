export type PaymentGatewayProvider = "RAZORPAY" | "PHONEPE"

export interface PaymentGatewayConfig {
  provider: PaymentGatewayProvider
  apiKey: string
  /** The real secret is never returned once saved — only a masked form, same as the medtech backend's CredentialEncryptionService. */
  maskedSecret: string
  active: boolean
  updatedAt: string
}
