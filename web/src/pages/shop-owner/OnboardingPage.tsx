import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import { onboard } from '../../api/franchiseApi';
import { useAuth } from '../../auth/AuthContext';

/** A Patient fills this in once to become a Franchise (shop owner) account. */
export function OnboardingPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      const response = await onboard({
        name: name.trim(),
        gstin: gstin.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
      });
      // The onboarding response carries a fresh token with role FRANCHISE —
      // the old PATIENT token would 403 on every /api/franchise/** call.
      setSession(response.token, response.role);
      navigate('/shop', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppLayout>
      <h2 style={{ marginTop: 0 }}>Set up your shop</h2>
      <p style={{ color: '#666', maxWidth: 480 }}>
        This turns your account into a shop owner account. You'll manage inventory, billing,
        invoice branding, and your payment gateway from here.
      </p>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>
          Shop name
          <input value={name} onChange={(e) => setName(e.target.value)} style={styles.input} />
        </label>
        <label style={styles.label}>
          GSTIN (optional)
          <input value={gstin} onChange={(e) => setGstin(e.target.value)} style={styles.input} />
        </label>
        <label style={styles.label}>
          Contact phone (optional)
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            style={styles.input}
          />
        </label>
        <label style={styles.label}>
          Contact email (optional)
          <input
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            style={styles.input}
          />
        </label>
        <button type="submit" disabled={isSaving || !name.trim()}>
          {isSaving ? 'Creating…' : 'Create my shop'}
        </button>
      </form>
    </AppLayout>
  );
}

const styles: Record<string, CSSProperties> = {
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
