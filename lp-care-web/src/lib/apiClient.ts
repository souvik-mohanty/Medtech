import axios from "axios"
import { API_BASE_URL } from "@/config"

// Shared key with authApi.ts so this file can read the JWT without a
// circular import — same pattern as the old medtech web/ app.
export const TOKEN_STORAGE_KEY = "lp-care-token"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { message?: string } | undefined)?.message ?? err.message
  }
  return err instanceof Error ? err.message : "Something went wrong"
}
