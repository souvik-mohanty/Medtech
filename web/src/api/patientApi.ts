import { apiClient } from './client';
import type { Bill, LabPaymentMode, LabTest, LabTestBooking, LabTestCombo, Product } from './franchiseApi';

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

export async function browseFranchiseLabTests(franchiseId: string): Promise<LabTest[]> {
  const response = await apiClient.get(`/api/patient/franchises/${franchiseId}/labtests`);
  return response.data.data as LabTest[];
}

export async function browseFranchiseLabTestCombos(franchiseId: string): Promise<LabTestCombo[]> {
  const response = await apiClient.get(`/api/patient/franchises/${franchiseId}/labtests/combos`);
  return response.data.data as LabTestCombo[];
}

export interface BookLabTestRequest {
  franchiseId: string;
  labTestId?: string;
  comboId?: string;
  address: string;
  mobileNumber: string;
  paymentMode: LabPaymentMode;
}

export async function bookLabTest(request: BookLabTestRequest): Promise<LabTestBooking> {
  const response = await apiClient.post('/api/patient/labtests/bookings', request);
  return response.data.data as LabTestBooking;
}
