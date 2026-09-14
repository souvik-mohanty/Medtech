import { apiClient } from './client';

export type InvoiceFont = 'DEFAULT' | 'SERIF' | 'MONOSPACE';
export type PaymentProvider = 'NONE' | 'RAZORPAY' | 'PHONEPE';

export interface FranchiseProfile {
  id: string;
  name: string;
  gstin: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  logoUrl: string | null;
  accentColorHex: string;
  invoiceFont: InvoiceFont;
  invoiceFooterNote: string | null;
  invoicePrefix: string | null;
}

export interface OnboardRequest {
  name: string;
  gstin?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface OnboardResponse extends FranchiseProfile {
  token: string;
  role: string;
}

export interface BrandingRequest {
  name: string;
  gstin?: string;
  contactPhone?: string;
  contactEmail?: string;
  logoUrl?: string;
  accentColorHex?: string;
  invoiceFont?: InvoiceFont;
  invoiceFooterNote?: string;
  invoicePrefix?: string;
}

export interface PaymentGatewayStatus {
  provider: PaymentProvider;
  maskedApiKey: string | null;
  configured: boolean;
  active: boolean;
}

export interface PaymentGatewayRequest {
  provider: PaymentProvider;
  apiKey: string;
  apiSecret: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string | null;
  sellingPrice: number;
  purchasePrice: number | null;
  mfgDate: string | null;
  expiryDate: string | null;
  stockQuantity: number;
  gstPercentage: number;
}

export interface ProductRequest {
  name: string;
  unit?: string;
  sellingPrice: number;
  purchasePrice?: number;
  mfgDate?: string;
  expiryDate?: string;
  stockQuantity: number;
  gstPercentage?: number;
}

export interface InventoryInsights {
  totalProducts: number;
  totalStockUnits: number;
  totalInventoryValue: number;
  expiringSoonCount: number;
  expiringSoon: Product[];
  expiredCount: number;
  expired: Product[];
}

export interface LabTest {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

export interface LabTestRequest {
  name: string;
  price: number;
}

export interface LabTestCombo {
  id: string;
  name: string;
  comboPrice: number;
  active: boolean;
  tests: LabTest[];
}

export interface LabTestComboRequest {
  name: string;
  comboPrice: number;
  testIds: string[];
}

export interface BillItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  gstPercentage: number;
  lineTotal: number;
}

export interface Bill {
  id: string;
  franchiseId: string;
  source: 'FRANCHISE_COUNTER' | 'PATIENT_ONLINE';
  customerName: string | null;
  customerPhone: string | null;
  patientEmail: string | null;
  items: BillItem[];
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  paymentMode: 'CASH' | 'ONLINE' | 'OFFLINE';
  status: string;
  invoiceNumber: string | null;
  createdAt: string;
}

export interface CounterBillRequest {
  items: { productId: string; quantity: number }[];
  customerName?: string;
  customerPhone?: string;
}

export async function onboard(request: OnboardRequest): Promise<OnboardResponse> {
  const response = await apiClient.post('/api/franchise/onboard', request);
  return response.data.data as OnboardResponse;
}

export async function getProfile(): Promise<FranchiseProfile> {
  const response = await apiClient.get('/api/franchise/profile');
  return response.data.data as FranchiseProfile;
}

export async function updateBranding(request: BrandingRequest): Promise<FranchiseProfile> {
  const response = await apiClient.put('/api/franchise/profile', request);
  return response.data.data as FranchiseProfile;
}

export async function getPaymentGatewayStatus(): Promise<PaymentGatewayStatus> {
  const response = await apiClient.get('/api/franchise/payment-gateway');
  return response.data.data as PaymentGatewayStatus;
}

export async function configurePaymentGateway(
  request: PaymentGatewayRequest,
): Promise<PaymentGatewayStatus> {
  const response = await apiClient.put('/api/franchise/payment-gateway', request);
  return response.data.data as PaymentGatewayStatus;
}

export async function disablePaymentGateway(): Promise<PaymentGatewayStatus> {
  const response = await apiClient.delete('/api/franchise/payment-gateway');
  return response.data.data as PaymentGatewayStatus;
}

export async function listProducts(): Promise<Product[]> {
  const response = await apiClient.get('/api/franchise/inventory/products');
  return response.data.data as Product[];
}

export async function createProduct(request: ProductRequest): Promise<Product> {
  const response = await apiClient.post('/api/franchise/inventory/products', request);
  return response.data.data as Product;
}

export async function getInventoryInsights(): Promise<InventoryInsights> {
  const response = await apiClient.get('/api/franchise/inventory/insights');
  return response.data.data as InventoryInsights;
}

export async function listLabTests(): Promise<LabTest[]> {
  const response = await apiClient.get('/api/franchise/labtests');
  return response.data.data as LabTest[];
}

export async function createLabTest(request: LabTestRequest): Promise<LabTest> {
  const response = await apiClient.post('/api/franchise/labtests', request);
  return response.data.data as LabTest;
}

export async function listLabTestCombos(): Promise<LabTestCombo[]> {
  const response = await apiClient.get('/api/franchise/labtests/combos');
  return response.data.data as LabTestCombo[];
}

export async function createLabTestCombo(request: LabTestComboRequest): Promise<LabTestCombo> {
  const response = await apiClient.post('/api/franchise/labtests/combos', request);
  return response.data.data as LabTestCombo;
}

export async function createCounterBill(request: CounterBillRequest): Promise<Bill> {
  const response = await apiClient.post('/api/franchise/billing/bills', request);
  return response.data.data as Bill;
}

export async function listBills(): Promise<Bill[]> {
  const response = await apiClient.get('/api/franchise/billing/bills');
  return response.data.data as Bill[];
}

// The endpoint requires the same bearer token as every other franchise
// call, so a plain <a href> won't work — fetch it as a blob and hand back
// an object URL the page can open in a new tab or embed.
export async function fetchInvoicePdfUrl(billId: string): Promise<string> {
  const response = await apiClient.get(`/api/franchise/billing/bills/${billId}/invoice`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(response.data as Blob);
}
