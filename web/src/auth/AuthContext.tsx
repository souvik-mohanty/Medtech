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

export const TOKEN_STORAGE_KEY = 'medtech_web_token';
const ROLE_STORAGE_KEY = 'medtech_web_role';

// The only two roles the platform has. Google OAuth auto-provisions PATIENT
// on first sign-in; FRANCHISE is reached only by a Patient onboarding their
// own shop (see setSession, used by the onboarding flow to hot-swap the
// token in place once the backend promotes the account).
const ALLOWED_ROLES = ['FRANCHISE', 'PATIENT'];

interface AuthState {
  token: string | null;
  role: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  loginWithGoogleIdToken: (idToken: string) => Promise<void>;
  setSession: (token: string, role: string) => void;
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
        throw new Error('This account is not authorized to use this app');
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

  // Used right after a Patient onboards into a Franchise (shop owner)
  // account: the backend returns a fresh token (role now FRANCHISE) since
  // the old one, minted at login, still says PATIENT — swap it in place so
  // the app doesn't need a full re-login.
  const setSession = useCallback((newToken: string, newRole: string) => {
    setToken(newToken);
    setRole(newRole);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setRole(null);
  }, []);

  const value = useMemo(
    () => ({ token, role, isLoading, error, loginWithGoogleIdToken, setSession, logout }),
    [token, role, isLoading, error, loginWithGoogleIdToken, setSession, logout],
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
