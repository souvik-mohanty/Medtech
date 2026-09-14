import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import { bookLabTest, browseFranchiseLabTestCombos, browseFranchiseLabTests } from '../../api/patientApi';
import type { LabPaymentMode, LabTest, LabTestBooking, LabTestCombo } from '../../api/franchiseApi';
import { useActiveFranchise } from './useActiveFranchise';

interface CartItem {
  kind: 'test' | 'combo';
  id: string;
  name: string;
  price: number;
}

interface BookingResult {
  name: string;
  booking?: LabTestBooking;
  error?: string;
}

const MAX_SEARCH_RESULTS = 8;

export function BookLabTestPage() {
  const { franchise, isLoading: isLoadingFranchise, error: franchiseError } = useActiveFranchise();

  const [tests, setTests] = useState<LabTest[] | null>(null);
  const [combos, setCombos] = useState<LabTestCombo[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState<LabPaymentMode>('CASH');
  const [isBooking, setIsBooking] = useState(false);
  const [results, setResults] = useState<BookingResult[] | null>(null);

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

  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term || !tests || !combos) return [];
    const inCart = (kind: CartItem['kind'], id: string) => cart.some((c) => c.kind === kind && c.id === id);

    const testMatches: CartItem[] = tests
      .filter((t) => t.name.toLowerCase().includes(term) && !inCart('test', t.id))
      .map((t) => ({ kind: 'test' as const, id: t.id, name: t.name, price: t.price }));
    const comboMatches: CartItem[] = combos
      .filter((c) => c.name.toLowerCase().includes(term) && !inCart('combo', c.id))
      .map((c) => ({ kind: 'combo' as const, id: c.id, name: c.name, price: c.comboPrice }));

    return [...testMatches, ...comboMatches].slice(0, MAX_SEARCH_RESULTS);
  }, [search, tests, combos, cart]);

  function addToCart(item: CartItem) {
    setCart((prev) => [...prev, item]);
    setSearch('');
  }

  function removeFromCart(kind: CartItem['kind'], id: string) {
    setCart((prev) => prev.filter((item) => !(item.kind === kind && item.id === id)));
  }

  async function handleBook(e: FormEvent) {
    e.preventDefault();
    if (!franchise || cart.length === 0 || !address.trim() || !mobileNumber.trim()) return;

    setIsBooking(true);
    setError(null);
    const outcomes: BookingResult[] = [];
    for (const item of cart) {
      try {
        const booking = await bookLabTest({
          franchiseId: franchise.id,
          labTestId: item.kind === 'test' ? item.id : undefined,
          comboId: item.kind === 'combo' ? item.id : undefined,
          address: address.trim(),
          mobileNumber: mobileNumber.trim(),
          paymentMode,
        });
        outcomes.push({ name: item.name, booking });
      } catch (err) {
        outcomes.push({ name: item.name, error: errorMessage(err) });
      }
    }
    setResults(outcomes);
    setIsBooking(false);
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  if (results) {
    return (
      <AppLayout>
        <h2 style={{ marginTop: 0 }}>Booking results</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Test / Combo</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i}>
                <td style={styles.td}>{r.name}</td>
                <td style={styles.td}>
                  {r.booking ? (
                    <span style={{ color: '#1F8A70' }}>
                      Booked — ₹{r.booking.amount.toFixed(2)},{' '}
                      {r.booking.status === 'PAID' ? 'paid' : 'payment pending'}
                    </span>
                  ) : (
                    <span style={{ color: '#c0392b' }}>Failed — {r.error}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paymentMode === 'CASH' && results.some((r) => r.booking) && (
          <p style={{ color: '#666', marginTop: '1rem' }}>Pay at the store when you visit.</p>
        )}
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

      {tests && combos && tests.length === 0 && combos.length === 0 ? (
        <p style={{ color: '#666' }}>This shop hasn't listed any lab tests yet.</p>
      ) : (
        <>
          <div style={styles.searchBox}>
            <label style={styles.label}>
              Search a test or combo
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Start typing…"
                style={styles.input}
              />
            </label>
            {searchResults.length > 0 && (
              <ul style={styles.resultList}>
                {searchResults.map((item) => (
                  <li key={`${item.kind}-${item.id}`}>
                    <button type="button" onClick={() => addToCart(item)} style={styles.resultButton}>
                      <span>
                        {item.name} {item.kind === 'combo' && <em>(combo)</em>}
                      </span>
                      <span style={{ color: '#666' }}>₹{item.price.toFixed(2)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {search.trim() && searchResults.length === 0 && (
              <p style={{ color: '#666', fontSize: '0.85rem' }}>No matching tests or combos.</p>
            )}
          </div>

          {cart.length > 0 && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Test / Combo</th>
                  <th style={styles.th}>Price</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={`${item.kind}-${item.id}`}>
                    <td style={styles.td}>
                      {item.name} {item.kind === 'combo' && <em style={{ color: '#666' }}>(combo)</em>}
                    </td>
                    <td style={styles.td}>₹{item.price.toFixed(2)}</td>
                    <td style={styles.td}>
                      <button type="button" onClick={() => removeFromCart(item.kind, item.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={styles.td}>
                    <strong>Total</strong>
                  </td>
                  <td style={styles.td} colSpan={2}>
                    <strong>₹{cartTotal.toFixed(2)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {cart.length > 0 && (
            <form onSubmit={handleBook} style={styles.form}>
              <h3 style={{ marginTop: 0 }}>Booking details</h3>
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
                {isBooking ? 'Booking…' : `Confirm booking (${cart.length} item${cart.length === 1 ? '' : 's'})`}
              </button>
            </form>
          )}
        </>
      )}
    </AppLayout>
  );
}

const styles: Record<string, CSSProperties> = {
  searchBox: {
    position: 'relative',
    marginBottom: '1.5rem',
  },
  resultList: {
    listStyle: 'none',
    margin: '0.5rem 0 0',
    padding: 0,
    border: '1px solid #e5e5e5',
    borderRadius: 4,
    maxWidth: 480,
  },
  resultButton: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: 'none',
    borderBottom: '1px solid #f0f0f0',
    background: 'none',
    textAlign: 'left',
    cursor: 'pointer',
  },
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
    maxWidth: 420,
  },
  input: {
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: 4,
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    maxWidth: 800,
    marginBottom: '1rem',
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
