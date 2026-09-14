import type { CSSProperties } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { token, error, loginWithGoogleIdToken } = useAuth();

  if (token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>MedTech Admin</h1>
        <p style={styles.subtitle}>Sign in with an Admin or Customer Support account</p>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.googleButton}>
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential) {
                loginWithGoogleIdToken(credentialResponse.credential).catch(() => {
                  // error is surfaced via the auth context's `error` state
                });
              }
            }}
            onError={() => {
              console.error('Google sign-in failed');
            }}
          />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f4f5f7',
  },
  card: {
    background: '#fff',
    padding: '2.5rem',
    borderRadius: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    textAlign: 'center',
    minWidth: 320,
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
  },
  subtitle: {
    color: '#666',
    marginTop: '0.5rem',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
  },
  error: {
    color: '#c0392b',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  googleButton: {
    display: 'flex',
    justifyContent: 'center',
  },
};
