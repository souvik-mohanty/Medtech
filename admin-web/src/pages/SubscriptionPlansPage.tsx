import { useEffect, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import axios from 'axios';
import { AppLayout } from '../components/AppLayout';
import {
  ALL_PLAN_FEATURES,
  createPlan,
  listPlans,
  setPlanActive,
  type PlanFeature,
  type SubscriptionPlan,
} from '../api/subscriptionPlans';

export function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      setPlans(await listPlans());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  function toggleFeature(feature: PlanFeature) {
    setFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature],
    );
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price || features.length === 0) return;

    setIsSaving(true);
    setError(null);
    try {
      await createPlan({ name: name.trim(), price: Number(price), features });
      setName('');
      setPrice('');
      setFeatures([]);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive(plan: SubscriptionPlan) {
    setError(null);
    try {
      await setPlanActive(plan.id, !plan.active);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <AppLayout>
      <h2 style={{ marginTop: 0 }}>Subscription Plans</h2>
      <p style={{ color: '#666', maxWidth: 640 }}>
        Plans a franchise can subscribe to, gated by feature. This is the plan catalog only —
        assigning a plan to a specific franchise, billing/collection, and actually gating the
        Doctor Appointment / Lab / Delivery modules by plan aren't built yet.
      </p>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      <form onSubmit={handleCreate} style={styles.form}>
        <h3 style={{ marginTop: 0 }}>Create a plan</h3>
        <div style={styles.fieldRow}>
          <label style={styles.label}>
            Plan name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard"
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Price (₹)
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={styles.input}
            />
          </label>
        </div>

        <fieldset style={styles.fieldset}>
          <legend>Features included</legend>
          {ALL_PLAN_FEATURES.map((f) => (
            <label key={f.value} style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={features.includes(f.value)}
                onChange={() => toggleFeature(f.value)}
              />
              {f.label}
            </label>
          ))}
        </fieldset>

        <button type="submit" disabled={isSaving || !name.trim() || !price || features.length === 0}>
          {isSaving ? 'Creating…' : 'Create plan'}
        </button>
      </form>

      <h3>Existing plans</h3>
      {isLoading ? (
        <p>Loading…</p>
      ) : plans.length === 0 ? (
        <p style={{ color: '#666' }}>No plans yet — create one above.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Price</th>
              <th style={styles.th}>Features</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td style={styles.td}>{plan.name}</td>
                <td style={styles.td}>₹{plan.price.toFixed(2)}</td>
                <td style={styles.td}>
                  {plan.features
                    .map((f) => ALL_PLAN_FEATURES.find((x) => x.value === f)?.label ?? f)
                    .join(', ')}
                </td>
                <td style={styles.td}>{plan.active ? 'Active' : 'Inactive'}</td>
                <td style={styles.td}>
                  <button onClick={() => handleToggleActive(plan)}>
                    {plan.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppLayout>
  );
}

function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { message?: string } | undefined)?.message ?? err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}

const styles: Record<string, CSSProperties> = {
  form: {
    border: '1px solid #e5e5e5',
    borderRadius: 8,
    padding: '1.5rem',
    maxWidth: 480,
    marginBottom: '2rem',
  },
  fieldRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
    fontSize: '0.9rem',
  },
  input: {
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: 4,
  },
  fieldset: {
    border: '1px solid #e5e5e5',
    borderRadius: 4,
    marginBottom: '1rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.25rem 0',
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    maxWidth: 800,
  },
  th: {
    textAlign: 'left',
    borderBottom: '2px solid #e5e5e5',
    padding: '0.5rem',
  },
  td: {
    borderBottom: '1px solid #f0f0f0',
    padding: '0.5rem',
  },
};
