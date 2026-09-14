import { apiClient } from './client';
import type { Bill, Product } from './franchiseApi';

export async function browseFranchiseProducts(franchiseId: string): Promise<Product[]> {
  const response = await apiClient.get(`/api/patient/franchises/${franchiseId}/products`);
  return response.data.data as Product[];
}

export interface PlaceOrderRequest {
  franchiseId: string;
  items: { productId: string; quantity: number }[];
}

export async function placeOrder(request: PlaceOrderRequest): Promise<Bill> {
  const response = await apiClient.post('/api/patient/orders', request);
  return response.data.data as Bill;
}
