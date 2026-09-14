import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import { listLabTestBookings, markLabTestBookingPaid, type LabTestBooking } from '../../api/franchiseApi';

export function LabBookingsPage() {
  const [bookings, setBookings] = useState<LabTestBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      setBookings(await listLabTestBookings());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMarkPaid(bookingId: string) {
    setMarkingPaidId(bookingId);
    setError(null);
    try {
      await markLabTestBookingPaid(bookingId);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setMarkingPaidId(null);
    }
  }

  return (
    <AppLayout>
      <h2 style={{ marginTop: 0 }}>Lab Bookings</h2>
      <p style={{ color: '#666', maxWidth: 640 }}>
        Every test/combo a patient has booked at your store — contact details, payment mode, and
        status.
      </p>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      {isLoading ? (
        <p>Loading…</p>
      ) : bookings.length === 0 ? (
        <p style={{ color: '#666' }}>No bookings yet.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Test / Combo</th>
              <th style={styles.th}>Patient</th>
              <th style={styles.th}>Mobile</th>
              <th style={styles.th}>Address</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Payment</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Booked</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td style={styles.td}>{b.itemName}</td>
                <td style={styles.td}>{b.patientEmail}</td>
                <td style={styles.td}>{b.mobileNumber}</td>
                <td style={{ ...styles.td, maxWidth: 220 }}>{b.address}</td>
                <td style={styles.td}>₹{b.amount.toFixed(2)}</td>
                <td style={styles.td}>{b.paymentMode}</td>
                <td style={styles.td}>
                  <span style={statusStyle(b.status)}>{statusLabel(b.status)}</span>
                </td>
                <td style={styles.td}>{new Date(b.createdAt).toLocaleString()}</td>
                <td style={styles.td}>
                  {b.paymentMode === 'CASH' && b.status !== 'PAID' && (
                    <button onClick={() => handleMarkPaid(b.id)} disabled={markingPaidId === b.id}>
                      {markingPaidId === b.id ? 'Marking…' : 'Mark paid'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppLayout>
  );
}

function statusLabel(status: string): string {
  return status === 'PAYMENT_PENDING' ? 'Payment pending' : status === 'PAID' ? 'Paid' : status;
}

function statusStyle(status: string): CSSProperties {
  if (status === 'PAID') return { color: '#1F8A70', fontWeight: 600 };
  if (status === 'PAYMENT_PENDING') return { color: '#b8860b', fontWeight: 600 };
  return {};
}

const styles: Record<string, CSSProperties> = {
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    maxWidth: 1100,
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
