import { useEffect, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import { createDoctorSchedule, listDoctorSchedules, type DoctorSchedule, type SlotType } from '../../api/franchiseApi';

export function DoctorSchedulesPage() {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [doctorSpecialization, setDoctorSpecialization] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [slotType, setSlotType] = useState<SlotType>('LIMITED');
  const [maxPatients, setMaxPatients] = useState('');
  const [fee, setFee] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      setSchedules(await listDoctorSchedules());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setDoctorName('');
    setDoctorSpecialization('');
    setScheduleDate('');
    setStartTime('');
    setEndTime('');
    setSlotType('LIMITED');
    setMaxPatients('');
    setFee('');
    setShowAdd(false);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!doctorName.trim() || !scheduleDate || !startTime || !endTime || !fee) return;
    if (slotType === 'LIMITED' && !maxPatients) return;

    setIsSaving(true);
    setError(null);
    try {
      await createDoctorSchedule({
        doctorName: doctorName.trim(),
        doctorSpecialization: doctorSpecialization.trim() || undefined,
        scheduleDate,
        startTime,
        endTime,
        slotType,
        maxPatients: slotType === 'LIMITED' ? Number(maxPatients) : undefined,
        fee: Number(fee),
      });
      resetForm();
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppLayout>
      <h2 style={{ marginTop: 0 }}>Doctor Schedules</h2>
      <p style={{ color: '#666', maxWidth: 640 }}>
        Set a doctor's visiting window. "Limited" caps how many patients can book and gives each a
        serial number seen in order; "As per request" is an open callback queue with no cap.
      </p>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      {!showAdd ? (
        <button type="button" onClick={() => setShowAdd(true)} style={{ marginBottom: '1.5rem' }}>
          + Add Schedule
        </button>
      ) : (
        <form onSubmit={handleAdd} style={styles.form}>
          <h3 style={{ marginTop: 0 }}>Add a schedule</h3>
          <div style={styles.fieldRow}>
            <label style={styles.label}>
              Doctor name
              <input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} style={styles.input} autoFocus />
            </label>
            <label style={styles.label}>
              Specialization (optional)
              <input
                value={doctorSpecialization}
                onChange={(e) => setDoctorSpecialization(e.target.value)}
                style={styles.input}
              />
            </label>
          </div>
          <div style={styles.fieldRow}>
            <label style={styles.label}>
              Date
              <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} style={styles.input} />
            </label>
            <label style={styles.label}>
              Start time
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={styles.input} />
            </label>
            <label style={styles.label}>
              End time
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={styles.input} />
            </label>
          </div>
          <div style={styles.fieldRow}>
            <label style={styles.label}>
              Slot type
              <select value={slotType} onChange={(e) => setSlotType(e.target.value as SlotType)} style={styles.input}>
                <option value="LIMITED">Limited (capped, serial numbers)</option>
                <option value="REQUEST">As per request (open queue)</option>
              </select>
            </label>
            {slotType === 'LIMITED' && (
              <label style={styles.label}>
                Max patients
                <input
                  type="number"
                  min="1"
                  value={maxPatients}
                  onChange={(e) => setMaxPatients(e.target.value)}
                  style={styles.input}
                />
              </label>
            )}
            <label style={styles.label}>
              Fee (₹)
              <input type="number" min="0" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} style={styles.input} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="submit"
              disabled={
                isSaving ||
                !doctorName.trim() ||
                !scheduleDate ||
                !startTime ||
                !endTime ||
                !fee ||
                (slotType === 'LIMITED' && !maxPatients)
              }
            >
              {isSaving ? 'Adding…' : 'Add schedule'}
            </button>
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <h3>Schedules</h3>
      {isLoading ? (
        <p>Loading…</p>
      ) : schedules.length === 0 ? (
        <p style={{ color: '#666' }}>No schedules yet — add one above.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Doctor</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Window</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Booked</th>
              <th style={styles.th}>Fee</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id}>
                <td style={styles.td}>
                  {s.doctorName}
                  {s.doctorSpecialization && <span style={{ color: '#666' }}> — {s.doctorSpecialization}</span>}
                </td>
                <td style={styles.td}>{s.scheduleDate}</td>
                <td style={styles.td}>
                  {s.startTime}–{s.endTime}
                </td>
                <td style={styles.td}>{s.slotType === 'LIMITED' ? 'Limited' : 'As per request'}</td>
                <td style={styles.td}>{s.slotType === 'LIMITED' ? `${s.bookedCount}/${s.maxPatients}` : '—'}</td>
                <td style={styles.td}>₹{s.fee.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppLayout>
  );
}

const styles: Record<string, CSSProperties> = {
  form: {
    border: '1px solid #e5e5e5',
    borderRadius: 8,
    padding: '1.5rem',
    maxWidth: 720,
    marginBottom: '2rem',
  },
  fieldRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
    minWidth: 140,
    fontSize: '0.9rem',
  },
  input: {
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: 4,
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    maxWidth: 900,
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
