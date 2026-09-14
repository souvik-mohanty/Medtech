import { useEffect, useState } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import { getProfile, type FranchiseProfile } from '../../api/franchiseApi';

export function DashboardPage() {
  const [profile, setProfile] = useState<FranchiseProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  return (
    <AppLayout>
      <h2 style={{ marginTop: 0 }}>Dashboard</h2>
      {error && <p style={{ color: '#c0392b' }}>{error}</p>}
      {profile && (
        <p style={{ color: '#666' }}>
          Welcome back, <strong>{profile.name}</strong>. Use the tabs above to take a counter
          sale, manage inventory, update your invoice branding, or configure your payment
          gateway.
        </p>
      )}
    </AppLayout>
  );
}
