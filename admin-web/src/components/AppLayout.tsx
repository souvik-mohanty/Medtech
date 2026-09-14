import type { CSSProperties, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function AppLayout({ children }: { children: ReactNode }) {
  const { role, logout } = useAuth();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh' }}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1 style={styles.title}>MedTech Super Admin</h1>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <NavLink to="/" end style={navStyle}>
              Dashboard
            </NavLink>
            <NavLink to="/subscription-plans" style={navStyle}>
              Subscription Plans
            </NavLink>
          </nav>
        </div>
        <div>
          <span style={{ marginRight: '1rem', color: '#666' }}>Signed in as {role}</span>
          <button onClick={logout}>Sign out</button>
        </div>
      </header>
      <main style={{ padding: '2rem' }}>{children}</main>
    </div>
  );
}

function navStyle({ isActive }: { isActive: boolean }): CSSProperties {
  return {
    textDecoration: 'none',
    color: isActive ? '#1F8A70' : '#333',
    fontWeight: isActive ? 600 : 400,
    borderBottom: isActive ? '2px solid #1F8A70' : '2px solid transparent',
    paddingBottom: '0.25rem',
  };
}

const styles: Record<string, CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    borderBottom: '1px solid #e5e5e5',
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
  },
};
