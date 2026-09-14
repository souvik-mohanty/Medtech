import { apiClient } from './client';

export type PlanFeature = 'DOCTOR_APPOINTMENT' | 'LAB_SERVICES' | 'DELIVERY';

export const ALL_PLAN_FEATURES: { value: PlanFeature; label: string }[] = [
  { value: 'DOCTOR_APPOINTMENT', label: 'Online Doctor Appointment' },
  { value: 'LAB_SERVICES', label: 'Lab Technician / Lab Services' },
  { value: 'DELIVERY', label: 'Delivery Partner' },
];

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: PlanFeature[];
  active: boolean;
  createdAt: string;
}

export interface SubscriptionPlanInput {
  name: string;
  price: number;
  features: PlanFeature[];
}

export async function listPlans(): Promise<SubscriptionPlan[]> {
  const response = await apiClient.get('/api/admin/subscription-plans');
  return response.data.data as SubscriptionPlan[];
}

export async function createPlan(input: SubscriptionPlanInput): Promise<SubscriptionPlan> {
  const response = await apiClient.post('/api/admin/subscription-plans', input);
  return response.data.data as SubscriptionPlan;
}

export async function updatePlan(id: string, input: SubscriptionPlanInput): Promise<SubscriptionPlan> {
  const response = await apiClient.put(`/api/admin/subscription-plans/${id}`, input);
  return response.data.data as SubscriptionPlan;
}

export async function setPlanActive(id: string, active: boolean): Promise<SubscriptionPlan> {
  const response = await apiClient.patch(
    `/api/admin/subscription-plans/${id}/${active ? 'reactivate' : 'deactivate'}`,
  );
  return response.data.data as SubscriptionPlan;
}
