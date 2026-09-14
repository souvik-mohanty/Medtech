import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const TOKEN_STORAGE_KEY = 'medtech_admin_token';
const ROLE_STORAGE_KEY = 'medtech_admin_role';

// Only these two roles may use the admin panel. Any other role that
// successfully signs in via Google is rejected client-side; the backend's
// own route-level RBAC is the real security boundary once admin APIs exist.
const ALLOWED_ROLES = ['ADMIN', 'CUSTOMER_SUPPORT'];

interface AuthState {
  token: string | null;
  role: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  loginWithGoogleIdToken: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [role, setRole] = useState<string | null>(() =>
    localStorage.getItem(ROLE_STORAGE_KEY),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && role) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(ROLE_STORAGE_KEY, role);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(ROLE_STORAGE_KEY);
    }
  }, [token, role]);

  const loginWithGoogleIdToken = useCallback(async (idToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/oauth/google`, {
        idToken,
      });
      const data = response.data?.data as { token: string; role: string };

      if (!ALLOWED_ROLES.includes(data.role)) {
        throw new Error('This account is not authorized for the admin panel');
      }

      setToken(data.token);
      setRole(data.role);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? err.message)
        : err instanceof Error
          ? err.message
          : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setRole(null);
  }, []);

  const value = useMemo(
    () => ({ token, role, isLoading, error, loginWithGoogleIdToken, logout }),
    [token, role, isLoading, error, loginWithGoogleIdToken, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
