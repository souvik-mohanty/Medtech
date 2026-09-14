import { useEffect, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import {
  configurePaymentGateway,
  disablePaymentGateway,
  getPaymentGatewayStatus,
  type PaymentGatewayStatus,
  type PaymentProvider,
} from '../../api/franchiseApi';

export function PaymentGatewayPage() {
  const [status, setStatus] = useState<PaymentGatewayStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [provider, setProvider] = useState<PaymentProvider>('RAZORPAY');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      setStatus(await getPaymentGatewayStatus());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfigure(e: FormEvent) {
    e.preventDefault();
    if (!apiKey.trim() || !apiSecret.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      const updated = await configurePaymentGateway({
        provider,
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
      });
      setStatus(updated);
      setApiKey('');
      setApiSecret('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDisable() {
    setError(null);
    try {
      setStatus(await disablePaymentGateway());
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <p>Loading…</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <h2 style={{ marginTop: 0 }}>Payment Gateway</h2>
      <p style={{ color: '#666', maxWidth: 560 }}>
        Bring your own Razorpay or PhonePe key + secret to accept online payments. Without one
        configured, every sale falls back to cash at the counter.
      </p>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      {status && (
        <div style={styles.statusBox}>
          <p style={{ margin: 0 }}>
            <strong>Provider:</strong> {status.provider}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Key:</strong> {status.maskedApiKey ?? 'Not configured'}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Status:</strong>{' '}
            {status.configured ? (status.active ? 'Active' : 'Configured but disabled') : 'Not configured'}
          </p>
          {status.configured && (
            <button onClick={handleDisable} style={{ marginTop: '0.5rem' }}>
              Disable online payments
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleConfigure} style={styles.form}>
        <h3 style={{ marginTop: 0 }}>{status?.configured ? 'Reconfigure' : 'Configure'}</h3>
        <label style={styles.label}>
          Provider
          <select value={provider} onChange={(e) => setProvider(e.target.value as PaymentProvider)} style={styles.input}>
            <option value="RAZORPAY">Razorpay</option>
            <option value="PHONEPE">PhonePe</option>
          </select>
        </label>
        <label style={styles.label}>
          API key (Razorpay Key ID / PhonePe Merchant ID)
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} style={styles.input} />
        </label>
        <label style={styles.label}>
          API secret (Razorpay Key Secret / PhonePe Salt Key)
          <input
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            style={styles.input}
          />
        </label>
        <button type="submit" disabled={isSaving || !apiKey.trim() || !apiSecret.trim()}>
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </AppLayout>
  );
}

const styles: Record<string, CSSProperties> = {
  statusBox: {
    border: '1px solid #e5e5e5',
    borderRadius: 8,
    padding: '1rem 1.5rem',
    maxWidth: 420,
    marginBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  form: {
    border: '1px solid #e5e5e5',
    borderRadius: 8,
    padding: '1.5rem',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    fontSize: '0.9rem',
  },
  input: {
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: 4,
  },
};
