import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import {
  getInventoryInsights,
  getProfile,
  type FranchiseProfile,
  type InventoryInsights,
} from '../../api/franchiseApi';

export function DashboardPage() {
  const [profile, setProfile] = useState<FranchiseProfile | null>(null);
  const [insights, setInsights] = useState<InventoryInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getProfile(), getInventoryInsights()])
      .then(([p, i]) => {
        setProfile(p);
        setInsights(i);
      })
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

      {insights && (
        <>
          <div style={styles.tileRow}>
            <StatTile label="Total Products" value={insights.totalProducts.toString()} />
            <StatTile label="Total Stock Units" value={insights.totalStockUnits.toString()} />
            <StatTile
              label="Total Inventory Value"
              value={`₹${insights.totalInventoryValue.toFixed(2)}`}
            />
          </div>

          {insights.expiredCount > 0 && (
            <div style={styles.alertBox('#c0392b')}>
              <h3 style={{ marginTop: 0 }}>Expired ({insights.expiredCount})</h3>
              <ul style={styles.list}>
                {insights.expired.map((p) => (
                  <li key={p.id}>
                    {p.name} — expired {p.expiryDate}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.expiringSoonCount > 0 && (
            <div style={styles.alertBox('#b8860b')}>
              <h3 style={{ marginTop: 0 }}>Expiring soon ({insights.expiringSoonCount})</h3>
              <ul style={styles.list}>
                {insights.expiringSoon.map((p) => (
                  <li key={p.id}>
                    {p.name} — expires {p.expiryDate}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.expiredCount === 0 && insights.expiringSoonCount === 0 && (
            <p style={{ color: '#666' }}>Nothing expiring in the next 30 days.</p>
          )}
        </>
      )}
    </AppLayout>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.tile}>
      <div style={styles.tileValue}>{value}</div>
      <div style={styles.tileLabel}>{label}</div>
    </div>
  );
}

const styles = {
  tileRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    margin: '1.5rem 0',
  } as CSSProperties,
  tile: {
    border: '1px solid #e5e5e5',
    borderRadius: 8,
    padding: '1rem 1.5rem',
    minWidth: 160,
  } as CSSProperties,
  tileValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
  } as CSSProperties,
  tileLabel: {
    color: '#666',
    fontSize: '0.85rem',
    marginTop: '0.25rem',
  } as CSSProperties,
  alertBox: (color: string): CSSProperties => ({
    border: `1px solid ${color}`,
    borderRadius: 8,
    padding: '1rem 1.5rem',
    marginBottom: '1rem',
    maxWidth: 480,
    color,
  }),
  list: {
    margin: 0,
    paddingLeft: '1.25rem',
  } as CSSProperties,
};
