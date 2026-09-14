import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import { browseFranchiseLabTestCombos, browseFranchiseLabTests, browseFranchiseProducts } from '../../api/patientApi';
import { useActiveFranchise } from './useActiveFranchise';

export function PatientHomePage() {
  const { franchise, isLoading: isLoadingFranchise, error: franchiseError } = useActiveFranchise();

  const [medicineCount, setMedicineCount] = useState<number | null>(null);
  const [labTestCount, setLabTestCount] = useState<number | null>(null);
  const [comboCount, setComboCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!franchise) return;
    Promise.all([
      browseFranchiseProducts(franchise.id),
      browseFranchiseLabTests(franchise.id),
      browseFranchiseLabTestCombos(franchise.id),
    ])
      .then(([products, tests, combos]) => {
        setMedicineCount(products.length);
        setLabTestCount(tests.length);
        setComboCount(combos.length);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [franchise]);

  if (isLoadingFranchise) {
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
      <h2 style={{ marginTop: 0 }}>{franchise.name}</h2>
      <p style={{ color: '#666' }}>What's available right now:</p>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      <div style={styles.cardRow}>
        <AvailabilityCard
          title="Medicines"
          count={medicineCount}
          available={medicineCount != null && medicineCount > 0}
          unavailableText="No medicines listed yet"
          link="/patient/order-medicine"
          linkText="Order medicine"
        />
        <AvailabilityCard
          title="Lab Tests"
          count={labTestCount != null && comboCount != null ? labTestCount + comboCount : null}
          available={(labTestCount ?? 0) + (comboCount ?? 0) > 0}
          unavailableText="No lab tests listed yet"
          link="/patient/lab-tests"
          linkText="Book a lab test"
        />
        <AvailabilityCard
          title="Doctor Appointments"
          count={null}
          available={false}
          unavailableText="Not available yet"
          link={null}
          linkText={null}
        />
      </div>
    </AppLayout>
  );
}

function AvailabilityCard({
  title,
  count,
  available,
  unavailableText,
  link,
  linkText,
}: {
  title: string;
  count: number | null;
  available: boolean;
  unavailableText: string;
  link: string | null;
  linkText: string | null;
}) {
  return (
    <div style={styles.card}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {count == null && available === false && link == null ? (
        <p style={{ color: '#666' }}>{unavailableText}</p>
      ) : count == null ? (
        <p style={{ color: '#666' }}>Loading…</p>
      ) : available ? (
        <>
          <p>
            <strong>{count}</strong> available
          </p>
          {link && linkText && <Link to={link}>{linkText} →</Link>}
        </>
      ) : (
        <p style={{ color: '#666' }}>{unavailableText}</p>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  cardRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    marginTop: '1.5rem',
  },
  card: {
    border: '1px solid #e5e5e5',
    borderRadius: 8,
    padding: '1.25rem',
    minWidth: 200,
    flex: 1,
  },
};
