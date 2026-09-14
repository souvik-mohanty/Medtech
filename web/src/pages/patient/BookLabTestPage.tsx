import { useEffect, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import { bookLabTest, browseFranchiseLabTestCombos, browseFranchiseLabTests } from '../../api/patientApi';
import type { LabPaymentMode, LabTest, LabTestBooking, LabTestCombo } from '../../api/franchiseApi';
import { useActiveFranchise } from './useActiveFranchise';

type Selected = { kind: 'test' | 'combo'; id: string; name: string; price: number } | null;

export function BookLabTestPage() {
  const { franchise, isLoading: isLoadingFranchise, error: franchiseError } = useActiveFranchise();

  const [tests, setTests] = useState<LabTest[] | null>(null);
  const [combos, setCombos] = useState<LabTestCombo[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Selected>(null);
  const [address, setAddress] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState<LabPaymentMode>('CASH');
  const [isBooking, setIsBooking] = useState(false);
  const [confirmed, setConfirmed] = useState<LabTestBooking | null>(null);

  useEffect(() => {
    if (!franchise) return;
    setIsLoading(true);
    setError(null);
    Promise.all([browseFranchiseLabTests(franchise.id), browseFranchiseLabTestCombos(franchise.id)])
      .then(([testList, comboList]) => {
        setTests(testList);
        setCombos(comboList);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [franchise]);

  async function handleBook(e: FormEvent) {
    e.preventDefault();
    if (!franchise || !selected || !address.trim() || !mobileNumber.trim()) return;

    setIsBooking(true);
    setError(null);
    try {
      const booking = await bookLabTest({
        franchiseId: franchise.id,
        labTestId: selected.kind === 'test' ? selected.id : undefined,
        comboId: selected.kind === 'combo' ? selected.id : undefined,
        address: address.trim(),
        mobileNumber: mobileNumber.trim(),
        paymentMode,
      });
      setConfirmed(booking);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsBooking(false);
    }
  }

  if (confirmed) {
    return (
      <AppLayout>
        <h2 style={{ marginTop: 0 }}>Booking confirmed</h2>
        <p>
          <strong>{confirmed.itemName}</strong> — ₹{confirmed.amount.toFixed(2)}
        </p>
        <p style={{ color: '#666' }}>
          Status: <strong>{confirmed.status === 'PAID' ? 'Paid' : 'Payment pending'}</strong>
          {confirmed.paymentMode === 'CASH' && ' — pay at the store when you visit.'}
        </p>
      </AppLayout>
    );
  }

  if (isLoadingFranchise || isLoading) {
    return (
      <AppLayout>
        <p>Loading…</p>
      </AppLayout>
    );
  }

  if (franchiseError) {
    return (
      <AppLayout>
        <p style={{ color: '#c0392b' }}>{franchiseError}</p>
      </AppLayout>
    );
  }

  if (!franchise) {
    return (
      <AppLayout>
        <p style={{ color: '#666' }}>No shop is available yet — check back later.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <h2 style={{ marginTop: 0 }}>Book a lab test — {franchise.name}</h2>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      {tests && combos && (
        <>
          <h3>Tests</h3>
          {tests.length === 0 ? (
            <p style={{ color: '#666' }}>No individual tests listed.</p>
          ) : (
            <ul style={styles.itemList}>
              {tests.map((t) => (
                <li key={t.id}>
                  <label style={styles.itemLabel}>
                    <input
                      type="radio"
                      name="selectedItem"
                      checked={selected?.kind === 'test' && selected.id === t.id}
                      onChange={() => setSelected({ kind: 'test', id: t.id, name: t.name, price: t.price })}
                    />
                    {t.name} — ₹{t.price.toFixed(2)}
                  </label>
                </li>
              ))}
            </ul>
          )}

          <h3>Combo packages</h3>
          {combos.length === 0 ? (
            <p style={{ color: '#666' }}>No combo packages listed.</p>
          ) : (
            <ul style={styles.itemList}>
              {combos.map((c) => (
                <li key={c.id}>
                  <label style={styles.itemLabel}>
                    <input
                      type="radio"
                      name="selectedItem"
                      checked={selected?.kind === 'combo' && selected.id === c.id}
                      onChange={() => setSelected({ kind: 'combo', id: c.id, name: c.name, price: c.comboPrice })}
                    />
                    {c.name} — ₹{c.comboPrice.toFixed(2)} ({c.tests.map((t) => t.name).join(', ')})
                  </label>
                </li>
              ))}
            </ul>
          )}

          {tests.length === 0 && combos.length === 0 && (
            <p style={{ color: '#666' }}>This shop hasn't listed any lab tests yet.</p>
          )}

          {selected && (
            <form onSubmit={handleBook} style={styles.form}>
              <h3 style={{ marginTop: 0 }}>
                Book: {selected.name} — ₹{selected.price.toFixed(2)}
              </h3>
              <label style={styles.label}>
                Address (required)
                <input value={address} onChange={(e) => setAddress(e.target.value)} style={styles.input} />
              </label>
              <label style={styles.label}>
                Mobile number (required)
                <input
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  style={styles.input}
                />
              </label>
              <label style={styles.label}>
                Payment
                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as LabPaymentMode)} style={styles.input}>
                  <option value="CASH">Pay at the store</option>
                  <option value="ONLINE">Pay online</option>
                </select>
              </label>
              <button type="submit" disabled={isBooking || !address.trim() || !mobileNumber.trim()}>
                {isBooking ? 'Booking…' : 'Confirm booking'}
              </button>
            </form>
          )}
        </>
      )}
    </AppLayout>
  );
}

const styles: Record<string, CSSProperties> = {
  form: {
    border: '1px solid #e5e5e5',
    borderRadius: 8,
    padding: '1.5rem',
    maxWidth: 420,
    marginTop: '1.5rem',
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
  itemList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    marginBottom: '1.5rem',
  },
  itemLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.35rem 0',
  },
};
