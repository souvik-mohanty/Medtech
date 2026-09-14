import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

/** Gates a section to one role. Wrong role bounces to their own section's home. */
export function RoleRoute({ allow, children }: { allow: 'FRANCHISE' | 'PATIENT'; children: ReactNode }) {
  const { token, role } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== allow) {
    return <Navigate to={role === 'FRANCHISE' ? '/shop' : '/patient'} replace />;
  }

  return <>{children}</>;
}
