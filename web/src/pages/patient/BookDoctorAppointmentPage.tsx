import { useEffect, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import { bookDoctorAppointment, browseFranchiseDoctorSchedules } from '../../api/patientApi';
import type { DoctorAppointment, DoctorSchedule, LabPaymentMode } from '../../api/franchiseApi';
import { useActiveFranchise } from './useActiveFranchise';

export function BookDoctorAppointmentPage() {
  const { franchise, isLoading: isLoadingFranchise, error: franchiseError } = useActiveFranchise();

  const [schedules, setSchedules] = useState<DoctorSchedule[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<DoctorSchedule | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [note, setNote] = useState('');
  const [paymentMode, setPaymentMode] = useState<LabPaymentMode>('CASH');
  const [isBooking, setIsBooking] = useState(false);
  const [confirmed, setConfirmed] = useState<DoctorAppointment | null>(null);

  useEffect(() => {
    if (!franchise) return;
    setIsLoading(true);
    setError(null);
    browseFranchiseDoctorSchedules(franchise.id)
      .then(setSchedules)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [franchise]);

  async function handleBook(e: FormEvent) {
    e.preventDefault();
    if (!selected || !mobileNumber.trim()) return;

    setIsBooking(true);
    setError(null);
    try {
      const appointment = await bookDoctorAppointment({
        scheduleId: selected.id,
        mobileNumber: mobileNumber.trim(),
        note: note.trim() || undefined,
        paymentMode,
      });
      setConfirmed(appointment);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsBooking(false);
    }
  }

  if (confirmed) {
    return (
      <AppLayout>
        <h2 style={{ marginTop: 0 }}>Appointment booked</h2>
        <p>
          <strong>{confirmed.doctorName}</strong>
          {confirmed.doctorSpecialization && ` — ${confirmed.doctorSpecialization}`}
        </p>
        <p style={{ color: '#666' }}>
          {confirmed.scheduleDate}, {confirmed.startTime}–{confirmed.endTime}
        </p>
        {confirmed.serialNumber != null && (
          <p>
            Your serial number: <strong>#{confirmed.serialNumber}</strong> — the doctor will see
            patients in order.
          </p>
        )}
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
      <h2 style={{ marginTop: 0 }}>Book a doctor appointment — {franchise.name}</h2>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      {schedules && (
        <>
          {schedules.length === 0 ? (
            <p style={{ color: '#666' }}>No doctor schedules available right now.</p>
          ) : (
            <ul style={styles.itemList}>
              {schedules.map((s) => {
                const isFull = s.slotType === 'LIMITED' && s.maxPatients != null && s.bookedCount >= s.maxPatients;
                return (
                  <li key={s.id}>
                    <label style={{ ...styles.itemLabel, opacity: isFull ? 0.5 : 1 }}>
                      <input
                        type="radio"
                        name="selectedSchedule"
                        checked={selected?.id === s.id}
                        disabled={isFull}
                        onChange={() => setSelected(s)}
                      />
                      <strong>{s.doctorName}</strong>
                      {s.doctorSpecialization && ` — ${s.doctorSpecialization}`} · {s.scheduleDate}{' '}
                      {s.startTime}–{s.endTime} · ₹{s.fee.toFixed(2)}{' '}
                      {s.slotType === 'LIMITED'
                        ? isFull
                          ? '(fully booked)'
                          : `(${s.bookedCount}/${s.maxPatients} booked)`
                        : '(request a callback)'}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          {selected && (
            <form onSubmit={handleBook} style={styles.form}>
              <h3 style={{ marginTop: 0 }}>
                Book: {selected.doctorName} — ₹{selected.fee.toFixed(2)}
              </h3>
              <label style={styles.label}>
                Mobile number (required)
                <input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} style={styles.input} />
              </label>
              <label style={styles.label}>
                Note {selected.slotType === 'REQUEST' ? '(tell us when to call you)' : '(optional)'}
                <input value={note} onChange={(e) => setNote(e.target.value)} style={styles.input} />
              </label>
              <label style={styles.label}>
                Payment
                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as LabPaymentMode)} style={styles.input}>
                  <option value="CASH">Pay at the store</option>
                  <option value="ONLINE">Pay online</option>
                </select>
              </label>
              <button type="submit" disabled={isBooking || !mobileNumber.trim()}>
                {isBooking ? 'Booking…' : 'Confirm appointment'}
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
