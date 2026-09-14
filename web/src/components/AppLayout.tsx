import type { CSSProperties, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const SHOP_NAV = [
  { to: '/shop', label: 'Dashboard', end: true },
  { to: '/shop/billing', label: 'Billing' },
  { to: '/shop/inventory', label: 'Inventory' },
  { to: '/shop/branding', label: 'Branding' },
  { to: '/shop/payment-gateway', label: 'Payment Gateway' },
];

const PATIENT_NAV = [
  { to: '/patient', label: 'Browse & Order', end: true },
  { to: '/onboard', label: 'Become a Shop Owner' },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { role, logout } = useAuth();
  const nav = role === 'FRANCHISE' ? SHOP_NAV : PATIENT_NAV;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh' }}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1 style={styles.title}>MedTech {role === 'FRANCHISE' ? 'Shop Owner' : 'Patient'}</h1>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} style={navStyle}>
                {item.label}
              </NavLink>
            ))}
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
