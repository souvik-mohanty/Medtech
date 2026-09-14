import { useEffect, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import { getProfile, updateBranding, type FranchiseProfile, type InvoiceFont } from '../../api/franchiseApi';

const FONTS: InvoiceFont[] = ['DEFAULT', 'SERIF', 'MONOSPACE'];

export function BrandingPage() {
  const [profile, setProfile] = useState<FranchiseProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [accentColorHex, setAccentColorHex] = useState('#1F8A70');
  const [invoiceFont, setInvoiceFont] = useState<InvoiceFont>('DEFAULT');
  const [invoiceFooterNote, setInvoiceFooterNote] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('');

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile(p);
        setName(p.name ?? '');
        setGstin(p.gstin ?? '');
        setContactPhone(p.contactPhone ?? '');
        setContactEmail(p.contactEmail ?? '');
        setLogoUrl(p.logoUrl ?? '');
        setAccentColorHex(p.accentColorHex);
        setInvoiceFont(p.invoiceFont);
        setInvoiceFooterNote(p.invoiceFooterNote ?? '');
        setInvoicePrefix(p.invoicePrefix ?? '');
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await updateBranding({
        name: name.trim(),
        gstin: gstin.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        accentColorHex,
        invoiceFont,
        invoiceFooterNote: invoiceFooterNote.trim() || undefined,
        invoicePrefix: invoicePrefix.trim() || undefined,
      });
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSaving(false);
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
      <h2 style={{ marginTop: 0 }}>Branding</h2>
      <p style={{ color: '#666', maxWidth: 480 }}>
        Your shop profile and invoice branding — shown on every generated PDF invoice.
      </p>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}
      {saved && <p style={{ color: '#1F8A70' }}>Saved.</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>
          Shop name
          <input value={name} onChange={(e) => setName(e.target.value)} style={styles.input} />
        </label>
        <label style={styles.label}>
          GSTIN
          <input value={gstin} onChange={(e) => setGstin(e.target.value)} style={styles.input} />
        </label>
        <label style={styles.label}>
          Contact phone
          <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} style={styles.input} />
        </label>
        <label style={styles.label}>
          Contact email
          <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} style={styles.input} />
        </label>
        <label style={styles.label}>
          Logo URL
          <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} style={styles.input} />
        </label>
        <label style={styles.label}>
          Accent color
          <input
            type="color"
            value={accentColorHex}
            onChange={(e) => setAccentColorHex(e.target.value)}
            style={{ ...styles.input, padding: 2, height: 36 }}
          />
        </label>
        <label style={styles.label}>
          Invoice font
          <select value={invoiceFont} onChange={(e) => setInvoiceFont(e.target.value as InvoiceFont)} style={styles.input}>
            {FONTS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label style={styles.label}>
          Invoice footer note
          <input value={invoiceFooterNote} onChange={(e) => setInvoiceFooterNote(e.target.value)} style={styles.input} />
        </label>
        <label style={styles.label}>
          Invoice prefix
          <input value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} placeholder="e.g. MTC" style={styles.input} />
        </label>
        <button type="submit" disabled={isSaving || !name.trim()}>
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </form>

      {profile && <p style={{ color: '#999', fontSize: '0.85rem' }}>Franchise ID: {profile.id}</p>}
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
