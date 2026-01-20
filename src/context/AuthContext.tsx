'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS, CurrencyCode, CURRENCY_RATES, convertCurrency as convertCurrencyUtil, formatCurrency as formatCurrencyUtil, formatPrice as formatPriceUtil } from '@/lib/config';
import { getProfile, loginUser, logoutUser, signupUser, updateProfile, verifySession, googleAuth, forgotPassword, resetPassword } from '@/lib/api';
import { UserProfile } from '@/lib/types';

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  sessionValidated: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetUserPassword: (token: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  updateMyProfile: (payload: Partial<UserProfile> & { password?: string; current_password?: string }) => Promise<boolean>;
  clearError: () => void;
  // Currency support
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (value: number | undefined | null, sourceCurrency?: CurrencyCode) => string;
  convertCurrency: (amount: number, from: CurrencyCode, to?: CurrencyCode) => number;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionValidated, setSessionValidated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrencyState] = useState<CurrencyCode>('JOD');

  // Load persisted currency preference
  useEffect(() => {
    const storedCurrency = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.currency) : null;
    if (storedCurrency && Object.keys(CURRENCY_RATES).includes(storedCurrency)) {
      setCurrencyState(storedCurrency as CurrencyCode);
    }
  }, []);

  const setCurrency = useCallback((newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.currency, newCurrency);
    }
  }, []);

  const formatPrice = useCallback(
    (value: number | undefined | null, sourceCurrency: CurrencyCode = 'JOD') => {
      return formatPriceUtil(value, sourceCurrency, currency);
    },
    [currency]
  );

  const convertCurrency = useCallback(
    (amount: number, from: CurrencyCode, to?: CurrencyCode) => {
      return convertCurrencyUtil(amount, from, to ?? currency);
    },
    [currency]
  );

  // Track if we've done the initial localStorage check
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.token) : null;
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.user) : null;

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.warn('Failed to parse stored user', err);
        }
      }
    } else {
      // No stored token - we're done loading
      setLoading(false);
    }
    setInitialCheckDone(true);
  }, []);

  useEffect(() => {
    // Don't run until initial localStorage check is complete
    if (!initialCheckDone) {
      return;
    }
    async function validateSession() {
      if (!token) {
        // No token after initial check means guest user - loading already set to false
        setSessionValidated(false);
        return;
      }
      try {
        const response = await verifySession(token);
        if (response.success && response.authenticated) {
          if (response.user) {
            setUser(response.user);
            localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(response.user));
          }
          // Only mark session as validated on successful verification
          setSessionValidated(true);
        } else {
          setSessionValidated(false);
          await handleLogout();
        }
      } catch (err) {
        console.error('Session validation failed', err);
        setSessionValidated(false);
        await handleLogout();
      } finally {
        setLoading(false);
      }
    }
    validateSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, initialCheckDone]);

  const persistAuth = useCallback((authToken: string, profile: UserProfile) => {
    setToken(authToken);
    setUser(profile);
    localStorage.setItem(STORAGE_KEYS.token, authToken);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(profile));
  }, []);

  const fetchProfileForToken = useCallback(async (authToken: string, fallback?: UserProfile | null) => {
    if (fallback) return fallback;
    try {
      const result = await getProfile(authToken);
      if (result.success) {
        return result.user;
      }
    } catch (err) {
      console.warn('Unable to load profile after auth', err);
    }
    return null;
  }, []);

  const handleLogin = useCallback(async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await loginUser(username, password);
      if (response.success && response.token) {
        const profile = await fetchProfileForToken(response.token, response.user);
        if (!profile) {
          setError('Unable to load profile details');
          return false;
        }
        persistAuth(response.token, profile);
        return true;
      }
      setError(response.error || 'Unable to login');
      return false;
    } catch (err: any) {
      setError(err.message || 'Unable to login');
      return false;
    } finally {
      setLoading(false);
    }
  }, [persistAuth, fetchProfileForToken]);

  const handleSignup = useCallback(async (username: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await signupUser(username, email, password);
      if (response.success && response.token) {
        const profile = await fetchProfileForToken(response.token, response.user);
        if (!profile) {
          setError('Unable to load profile details');
          return false;
        }
        persistAuth(response.token, profile);
        return true;
      }
      setError(response.error || 'Unable to sign up');
      return false;
    } catch (err: any) {
      setError(err.message || 'Unable to sign up');
      return false;
    } finally {
      setLoading(false);
    }
  }, [persistAuth, fetchProfileForToken]);

  const handleGoogleLogin = useCallback(async (credential: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await googleAuth(credential);
      if (response.success && response.token) {
        const profile = await fetchProfileForToken(response.token, response.user);
        if (!profile) {
          setError('Unable to load profile details');
          return false;
        }
        persistAuth(response.token, profile);
        return true;
      }
      setError(response.error || 'Google sign-in failed');
      return false;
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [persistAuth, fetchProfileForToken]);

  const handleForgotPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await forgotPassword(email);
      return { success: response.success, message: response.message };
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
      return { success: false, message: err.message || 'Failed to send reset email' };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleResetPassword = useCallback(async (resetToken: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await resetPassword(resetToken, newPassword);
      return { success: response.success, message: response.message };
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
      return { success: false, message: err.message || 'Failed to reset password' };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      if (token) {
        await logoutUser(token);
      }
    } catch (err) {
      console.warn('Logout warning:', err);
    } finally {
      setToken(null);
      setUser(null);
      setSessionValidated(false);
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.user);
    }
  }, [token]);

  const refreshProfile = useCallback(async () => {
    if (!token) return null;
    try {
      const response = await getProfile(token);
      if (response.success) {
        setUser(response.user);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(response.user));
        return response.user;
      }
    } catch (err) {
      console.error('Failed to refresh profile', err);
    }
    return null;
  }, [token]);

  const updateMyProfile = useCallback(
    async (payload: Partial<UserProfile> & { password?: string; current_password?: string }) => {
      if (!token) return false;
      try {
        const response = await updateProfile(payload, token);
        if (response.success) {
          await refreshProfile();
          return true;
        }
        setError(response.error || 'Unable to update profile');
        return false;
      } catch (err: any) {
        setError(err.message || 'Unable to update profile');
        return false;
      }
    },
    [token, refreshProfile]
  );

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    loading,
    sessionValidated,
    error,
    login: handleLogin,
    signup: handleSignup,
    loginWithGoogle: handleGoogleLogin,
    requestPasswordReset: handleForgotPassword,
    resetUserPassword: handleResetPassword,
    logout: handleLogout,
    refreshProfile,
    updateMyProfile,
    clearError: () => setError(null),
    // Currency support
    currency,
    setCurrency,
    formatPrice,
    convertCurrency,
  }), [user, token, loading, error, handleLogin, handleSignup, handleGoogleLogin, handleForgotPassword, handleResetPassword, handleLogout, refreshProfile, updateMyProfile, currency, setCurrency, formatPrice, convertCurrency]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
