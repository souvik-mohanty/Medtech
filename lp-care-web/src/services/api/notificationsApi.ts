import { apiClient } from "@/lib/apiClient"
import type { AppNotification } from "@/types"

// ---- Patient-facing ----

export async function getMyNotifications(): Promise<AppNotification[]> {
  const response = await apiClient.get<{ data: AppNotification[] }>("/api/patient/notifications")
  return response.data.data
}

export async function getMyUnreadCount(): Promise<number> {
  const response = await apiClient.get<{ data: { count: number } }>("/api/patient/notifications/unread-count")
  return response.data.data.count
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/api/patient/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch("/api/patient/notifications/mark-all-read")
}

// ---- Owner-facing ----

export async function getOwnerNotifications(): Promise<AppNotification[]> {
  const response = await apiClient.get<{ data: AppNotification[] }>("/api/franchise/notifications")
  return response.data.data
}

export async function getOwnerUnreadCount(): Promise<number> {
  const response = await apiClient.get<{ data: { count: number } }>("/api/franchise/notifications/unread-count")
  return response.data.data.count
}
