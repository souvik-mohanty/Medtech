import { apiClient } from "@/lib/apiClient"
import type { Product, SalesChannel } from "@/types"

interface BackendProduct {
  id: string
  name: string
  unit: string | null
  sellingPrice: number
  purchasePrice: number | null
  mfgDate: string | null
  purchaseDate: string | null
  supplier: string | null
  expiryDate: string | null
  stockQuantity: number
  gstPercentage: number
  prescriptionRequired: boolean
  active: boolean
  salesChannel: SalesChannel
}

function toProduct(p: BackendProduct): Product {
  return {
    id: p.id,
    name: p.name,
    unit: p.unit ?? undefined,
    sellingPrice: p.sellingPrice,
    purchasePrice: p.purchasePrice ?? undefined,
    mfgDate: p.mfgDate ?? undefined,
    purchaseDate: p.purchaseDate ?? undefined,
    supplier: p.supplier ?? undefined,
    expiryDate: p.expiryDate ?? undefined,
    stockQuantity: p.stockQuantity,
    gstPercentage: p.gstPercentage,
    prescriptionRequired: p.prescriptionRequired,
    active: p.active,
    salesChannel: p.salesChannel,
  }
}

/** Patient browsing a specific franchise's catalog. Active products only. */
export async function getProducts(franchiseId: string): Promise<Product[]> {
  const response = await apiClient.get<{ data: BackendProduct[] }>(`/api/patient/franchises/${franchiseId}/products`)
  return response.data.data.map(toProduct)
}

// ---- Owner-facing inventory management ----

export async function getAllProducts(): Promise<Product[]> {
  const response = await apiClient.get<{ data: BackendProduct[] }>("/api/franchise/inventory/products")
  return response.data.data.map(toProduct)
}

export type ProductInput = Omit<Product, "id" | "active">

export async function createProduct(input: ProductInput): Promise<Product> {
  const response = await apiClient.post<{ data: BackendProduct }>("/api/franchise/inventory/products", input)
  return toProduct(response.data.data)
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const response = await apiClient.put<{ data: BackendProduct }>(`/api/franchise/inventory/products/${id}`, input)
  return toProduct(response.data.data)
}

export async function toggleProductActive(id: string): Promise<Product> {
  const response = await apiClient.patch<{ data: BackendProduct }>(`/api/franchise/inventory/products/${id}/toggle-active`)
  return toProduct(response.data.data)
}

export interface InventoryInsights {
  totalProducts: number
  totalStockUnits: number
  totalInventoryValue: number
  expiringSoonCount: number
  expiringSoon: Product[]
  expiredCount: number
  expired: Product[]
}

interface BackendInsights {
  totalProducts: number
  totalStockUnits: number
  totalInventoryValue: number
  expiringSoonCount: number
  expiringSoon: BackendProduct[]
  expiredCount: number
  expired: BackendProduct[]
}

export async function getInventoryInsights(): Promise<InventoryInsights> {
  const response = await apiClient.get<{ data: BackendInsights }>("/api/franchise/inventory/insights")
  const d = response.data.data
  return {
    totalProducts: d.totalProducts,
    totalStockUnits: d.totalStockUnits,
    totalInventoryValue: d.totalInventoryValue,
    expiringSoonCount: d.expiringSoonCount,
    expiringSoon: d.expiringSoon.map(toProduct),
    expiredCount: d.expiredCount,
    expired: d.expired.map(toProduct),
  }
}
