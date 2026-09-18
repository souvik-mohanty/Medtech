// Thin wrapper around Razorpay's Checkout.js — loaded on demand (only once
// a patient actually reaches an online payment step) rather than on every
// page load. See bookingsApi#verifyOnlinePayment for what happens with the
// response this hands back: the backend re-verifies it against Razorpay
// directly, nothing here is trusted on its own.

export interface RazorpaySuccessResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface RazorpayCheckoutInstance {
  open: () => void
}

interface RazorpayCheckoutOptions {
  key: string
  order_id: string
  amount: number
  currency: string
  name: string
  description?: string
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  handler: (response: RazorpaySuccessResponse) => void
  modal?: { ondismiss?: () => void }
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js"
let scriptPromise: Promise<void> | null = null

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = SCRIPT_SRC
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        scriptPromise = null
        reject(new Error("Couldn't load the payment gateway — check your connection and try again."))
      }
      document.body.appendChild(script)
    })
  }
  return scriptPromise
}

export interface OpenRazorpayCheckoutOptions {
  keyId: string
  orderId: string
  amountPaise: number
  labName: string
  description: string
  prefillName?: string
  prefillEmail?: string
  prefillContact?: string
  onSuccess: (response: RazorpaySuccessResponse) => void
  onDismiss: () => void
}

export async function openRazorpayCheckout(options: OpenRazorpayCheckoutOptions): Promise<void> {
  await loadRazorpayScript()
  if (!window.Razorpay) {
    throw new Error("Couldn't load the payment gateway — check your connection and try again.")
  }
  const checkout = new window.Razorpay({
    key: options.keyId,
    order_id: options.orderId,
    amount: options.amountPaise,
    currency: "INR",
    name: options.labName,
    description: options.description,
    prefill: {
      name: options.prefillName,
      email: options.prefillEmail,
      contact: options.prefillContact,
    },
    handler: options.onSuccess,
    modal: { ondismiss: options.onDismiss },
  })
  checkout.open()
}
