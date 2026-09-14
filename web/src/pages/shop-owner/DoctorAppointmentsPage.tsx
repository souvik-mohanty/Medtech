import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import { listDoctorAppointments, markDoctorAppointmentPaid, type DoctorAppointment } from '../../api/franchiseApi';

export function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
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
      setAppointments(await listDoctorAppointments());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMarkPaid(appointmentId: string) {
    setMarkingPaidId(appointmentId);
    setError(null);
    try {
      await markDoctorAppointmentPaid(appointmentId);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setMarkingPaidId(null);
    }
  }

  return (
    <AppLayout>
      <h2 style={{ marginTop: 0 }}>Doctor Appointments</h2>
      <p style={{ color: '#666', maxWidth: 640 }}>
        Every appointment booked at your store — serial number (for limited sessions) or note (for
        as-per-request), contact info, and payment status.
      </p>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      {isLoading ? (
        <p>Loading…</p>
      ) : appointments.length === 0 ? (
        <p style={{ color: '#666' }}>No appointments yet.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Doctor</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Patient</th>
              <th style={styles.th}>Mobile</th>
              <th style={styles.th}>Serial / Note</th>
              <th style={styles.th}>Fee</th>
              <th style={styles.th}>Payment</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td style={styles.td}>{a.doctorName}</td>
                <td style={styles.td}>
                  {a.scheduleDate} {a.startTime}–{a.endTime}
                </td>
                <td style={styles.td}>{a.patientEmail}</td>
                <td style={styles.td}>{a.mobileNumber}</td>
                <td style={styles.td}>{a.slotType === 'LIMITED' ? `#${a.serialNumber}` : a.note ?? '—'}</td>
                <td style={styles.td}>₹{a.fee.toFixed(2)}</td>
                <td style={styles.td}>{a.paymentMode}</td>
                <td style={styles.td}>
                  <span style={statusStyle(a.status)}>{statusLabel(a.status)}</span>
                </td>
                <td style={styles.td}>
                  {a.paymentMode === 'CASH' && a.status !== 'PAID' && (
                    <button onClick={() => handleMarkPaid(a.id)} disabled={markingPaidId === a.id}>
                      {markingPaidId === a.id ? 'Marking…' : 'Mark paid'}
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
