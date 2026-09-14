export type NotificationType =
  | "BOOKING_CONFIRMATION"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILURE"
  | "COLLECTION_REMINDER"
  | "COLLECTION_UPDATE"
  | "REPORT_READY"
  | "INVOICE_GENERATED"
  | "REFUND_UPDATE"

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
}
