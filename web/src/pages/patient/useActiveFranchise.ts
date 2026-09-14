import { useEffect, useState } from 'react';
import { errorMessage } from '../../api/client';
import { listFranchises } from '../../api/patientApi';
import type { FranchiseProfile } from '../../api/franchiseApi';

/**
 * Only one shop exists today, so every patient page just uses the first
 * (only) active franchise instead of asking the patient to look one up.
 */
export function useActiveFranchise() {
  const [franchise, setFranchise] = useState<FranchiseProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listFranchises()
      .then((list) => setFranchise(list[0] ?? null))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  return { franchise, isLoading, error };
}
