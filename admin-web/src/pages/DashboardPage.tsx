import { AppLayout } from '../components/AppLayout';

export function DashboardPage() {
  return (
    <AppLayout>
      <h2 style={{ marginTop: 0 }}>Dashboard</h2>
      <p style={{ color: '#666' }}>
        Franchise onboarding, pricing/commission control, coupon management, global analytics,
        and audit logs (see docs/PROJECT_SPEC.md § Admin Module) are not built yet. Subscription
        plan management is — see the Subscription Plans tab.
      </p>
    </AppLayout>
  );
}
