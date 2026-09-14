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
  purchaseDate: string | null;
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
  purchaseDate?: string;
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

export type LabPaymentMode = 'CASH' | 'ONLINE';
export type LabBookingStatus = 'CREATED' | 'PAYMENT_PENDING' | 'PAID' | 'CONFIRMED' | 'CANCELLED';

export type SlotType = 'LIMITED' | 'REQUEST';

export interface DoctorSchedule {
  id: string;
  doctorName: string;
  doctorSpecialization: string | null;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  slotType: SlotType;
  maxPatients: number | null;
  bookedCount: number;
  fee: number;
  active: boolean;
}

export interface DoctorScheduleRequest {
  doctorName: string;
  doctorSpecialization?: string;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  slotType: SlotType;
  maxPatients?: number;
  fee: number;
}

export interface DoctorAppointment {
  id: string;
  patientEmail: string;
  doctorName: string;
  doctorSpecialization: string | null;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  slotType: SlotType;
  serialNumber: number | null;
  mobileNumber: string;
  note: string | null;
  fee: number;
  paymentMode: LabPaymentMode;
  status: LabBookingStatus;
  createdAt: string;
  paidAt: string | null;
}

export interface LabTestBooking {
  id: string;
  patientEmail: string;
  itemName: string;
  amount: number;
  address: string;
  mobileNumber: string;
  paymentMode: LabPaymentMode;
  status: LabBookingStatus;
  createdAt: string;
  paidAt: string | null;
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
  discountAmount: number;
  totalAmount: number;
  paymentMode: 'CASH' | 'ONLINE' | 'OFFLINE';
  status: string;
  invoiceNumber: string | null;
  note: string | null;
  createdAt: string;
}

export type DiscountType = 'FLAT' | 'PERCENTAGE';

export interface CounterBillRequest {
  items: { productId: string; quantity: number }[];
  customerName?: string;
  customerPhone?: string;
  discountType?: DiscountType;
  discountValue?: number;
  note?: string;
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

export async function listLabTestBookings(): Promise<LabTestBooking[]> {
  const response = await apiClient.get('/api/franchise/labtests/bookings');
  return response.data.data as LabTestBooking[];
}

export async function markLabTestBookingPaid(bookingId: string): Promise<LabTestBooking> {
  const response = await apiClient.patch(`/api/franchise/labtests/bookings/${bookingId}/mark-paid`);
  return response.data.data as LabTestBooking;
}

export async function listDoctorSchedules(): Promise<DoctorSchedule[]> {
  const response = await apiClient.get('/api/franchise/doctors/schedules');
  return response.data.data as DoctorSchedule[];
}

export async function createDoctorSchedule(request: DoctorScheduleRequest): Promise<DoctorSchedule> {
  const response = await apiClient.post('/api/franchise/doctors/schedules', request);
  return response.data.data as DoctorSchedule;
}

export async function listDoctorAppointments(): Promise<DoctorAppointment[]> {
  const response = await apiClient.get('/api/franchise/doctors/appointments');
  return response.data.data as DoctorAppointment[];
}

export async function markDoctorAppointmentPaid(appointmentId: string): Promise<DoctorAppointment> {
  const response = await apiClient.patch(`/api/franchise/doctors/appointments/${appointmentId}/mark-paid`);
  return response.data.data as DoctorAppointment;
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
