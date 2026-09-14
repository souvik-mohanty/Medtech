import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import { placeOrder } from '../../api/patientApi';
import type { Bill } from '../../api/franchiseApi';

interface CartLine {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

interface LocationState {
  franchiseId: string;
  lines: CartLine[];
}

/**
 * Places a PAYMENT_PENDING online order — there's no payment gateway wired
 * up client-side yet, so this only confirms the order was created, it
 * doesn't complete a purchase (see PatientOrderController).
 */
export function PlaceOrderPage() {
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBill, setConfirmedBill] = useState<Bill | null>(null);

  if (!state) {
    return <Navigate to="/patient" replace />;
  }

  const total = state.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  async function handlePlaceOrder() {
    setIsPlacing(true);
    setError(null);
    try {
      const bill = await placeOrder({
        franchiseId: state!.franchiseId,
        items: state!.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      });
      setConfirmedBill(bill);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsPlacing(false);
    }
  }

  if (confirmedBill) {
    return (
      <AppLayout>
        <h2 style={{ marginTop: 0 }}>Order placed</h2>
        <p style={{ color: '#666' }}>
          Status: <strong>{confirmedBill.status}</strong> — payment isn't collected online yet, so
          the shop will follow up to confirm and complete this order.
        </p>
        <p>Total: ₹{confirmedBill.totalAmount.toFixed(2)}</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <h2 style={{ marginTop: 0 }}>Review your order</h2>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Product</th>
            <th style={styles.th}>Qty</th>
            <th style={styles.th}>Price</th>
            <th style={styles.th}>Line total</th>
          </tr>
        </thead>
        <tbody>
          {state.lines.map((line) => (
            <tr key={line.productId}>
              <td style={styles.td}>{line.productName}</td>
              <td style={styles.td}>{line.quantity}</td>
              <td style={styles.td}>₹{line.price.toFixed(2)}</td>
              <td style={styles.td}>₹{(line.price * line.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ fontWeight: 600 }}>Total: ₹{total.toFixed(2)}</p>

      <button onClick={handlePlaceOrder} disabled={isPlacing}>
        {isPlacing ? 'Placing order…' : 'Place order'}
      </button>
    </AppLayout>
  );
}

const styles: Record<string, CSSProperties> = {
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    maxWidth: 640,
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
