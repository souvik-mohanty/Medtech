import { useEffect, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import {
  createLabTest,
  createLabTestCombo,
  listLabTestCombos,
  listLabTests,
  type LabTest,
  type LabTestCombo,
} from '../../api/franchiseApi';

export function LabTestsPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [combos, setCombos] = useState<LabTestCombo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddTest, setShowAddTest] = useState(false);
  const [testName, setTestName] = useState('');
  const [testPrice, setTestPrice] = useState('');
  const [isSavingTest, setIsSavingTest] = useState(false);

  const [showAddCombo, setShowAddCombo] = useState(false);
  const [comboName, setComboName] = useState('');
  const [comboPrice, setComboPrice] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [isSavingCombo, setIsSavingCombo] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const [testList, comboList] = await Promise.all([listLabTests(), listLabTestCombos()]);
      setTests(testList);
      setCombos(comboList);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddTest(e: FormEvent) {
    e.preventDefault();
    if (!testName.trim() || !testPrice) return;

    setIsSavingTest(true);
    setError(null);
    try {
      await createLabTest({ name: testName.trim(), price: Number(testPrice) });
      setTestName('');
      setTestPrice('');
      setShowAddTest(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSavingTest(false);
    }
  }

  function toggleTestSelection(testId: string) {
    setSelectedTestIds((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId],
    );
  }

  async function handleAddCombo(e: FormEvent) {
    e.preventDefault();
    if (!comboName.trim() || !comboPrice || selectedTestIds.length === 0) return;

    setIsSavingCombo(true);
    setError(null);
    try {
      await createLabTestCombo({
        name: comboName.trim(),
        comboPrice: Number(comboPrice),
        testIds: selectedTestIds,
      });
      setComboName('');
      setComboPrice('');
      setSelectedTestIds([]);
      setShowAddCombo(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSavingCombo(false);
    }
  }

  return (
    <AppLayout>
      <h2 style={{ marginTop: 0 }}>Lab Tests</h2>
      <p style={{ color: '#666', maxWidth: 640 }}>
        Define the individual test types you offer and their price, then optionally bundle a few
        into a discounted combo package.
      </p>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      {!showAddTest ? (
        <button type="button" onClick={() => setShowAddTest(true)} style={{ marginBottom: '1.5rem' }}>
          + Add Test
        </button>
      ) : (
        <form onSubmit={handleAddTest} style={styles.form}>
          <h3 style={{ marginTop: 0 }}>Add a test</h3>
          <div style={styles.fieldRow}>
            <label style={styles.label}>
              Test name
              <input
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g. Complete Blood Count"
                style={styles.input}
                autoFocus
              />
            </label>
            <label style={styles.label}>
              Price (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={testPrice}
                onChange={(e) => setTestPrice(e.target.value)}
                style={styles.input}
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={isSavingTest || !testName.trim() || !testPrice}>
              {isSavingTest ? 'Adding…' : 'Add test'}
            </button>
            <button type="button" onClick={() => setShowAddTest(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <h3>Tests</h3>
      {isLoading ? (
        <p>Loading…</p>
      ) : tests.length === 0 ? (
        <p style={{ color: '#666' }}>No tests yet — add one above.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Price</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((t) => (
              <tr key={t.id}>
                <td style={styles.td}>{t.name}</td>
                <td style={styles.td}>₹{t.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!showAddCombo ? (
        <button
          type="button"
          onClick={() => setShowAddCombo(true)}
          disabled={tests.length === 0}
          title={tests.length === 0 ? 'Add at least one test first' : undefined}
          style={{ marginBottom: '1.5rem' }}
        >
          + Add Combo
        </button>
      ) : (
        <form onSubmit={handleAddCombo} style={styles.form}>
          <h3 style={{ marginTop: 0 }}>Add a combo package</h3>
          <div style={styles.fieldRow}>
            <label style={styles.label}>
              Combo name
              <input
                value={comboName}
                onChange={(e) => setComboName(e.target.value)}
                placeholder="e.g. Basic Health Checkup"
                style={styles.input}
                autoFocus
              />
            </label>
            <label style={styles.label}>
              Combo price (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={comboPrice}
                onChange={(e) => setComboPrice(e.target.value)}
                style={styles.input}
              />
            </label>
          </div>
          <fieldset style={styles.fieldset}>
            <legend>Included tests</legend>
            {tests.map((t) => (
              <label key={t.id} style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedTestIds.includes(t.id)}
                  onChange={() => toggleTestSelection(t.id)}
                />
                {t.name} (₹{t.price.toFixed(2)})
              </label>
            ))}
          </fieldset>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="submit"
              disabled={isSavingCombo || !comboName.trim() || !comboPrice || selectedTestIds.length === 0}
            >
              {isSavingCombo ? 'Adding…' : 'Add combo'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddCombo(false);
                setSelectedTestIds([]);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <h3>Combo packages</h3>
      {combos.length === 0 ? (
        <p style={{ color: '#666' }}>No combos yet.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Combo Price</th>
              <th style={styles.th}>Includes</th>
            </tr>
          </thead>
          <tbody>
            {combos.map((c) => (
              <tr key={c.id}>
                <td style={styles.td}>{c.name}</td>
                <td style={styles.td}>₹{c.comboPrice.toFixed(2)}</td>
                <td style={styles.td}>{c.tests.map((t) => t.name).join(', ')}</td>
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
    maxWidth: 640,
    marginBottom: '2rem',
  },
  fieldRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
    fontSize: '0.9rem',
  },
  input: {
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: 4,
  },
  fieldset: {
    border: '1px solid #e5e5e5',
    borderRadius: 4,
    marginBottom: '1rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.25rem 0',
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    maxWidth: 800,
    marginBottom: '2rem',
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
