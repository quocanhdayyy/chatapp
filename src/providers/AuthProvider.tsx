import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { login, logout } from '../api/auth';
import { getMyProfile } from '../api/profile';
import { ApiError } from '../core/network/ApiError';
import { clearSession, loadSession, saveSession, subscribeSession, updateSessionUser } from '../storage/session';
import type { AuthSession, User } from '../types/auth';

type AuthValue = {
  user: User | null;
  status: 'loading' | 'ready' | 'error';
  error: string;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: User) => void;
  restore: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

async function restoreStoredSession(): Promise<AuthSession | null> {
  if (!loadSession()) return null;
  const profile = await getMyProfile();
  updateSessionUser({ id: profile.id, name: profile.name, email: profile.email });
  return loadSession();
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthValue['status']>('loading');
  const [error, setError] = useState('');

  const handleRestored = useCallback((saved: AuthSession | null) => {
    setSession(saved);
    setError('');
    setStatus('ready');
  }, []);

  const handleRestoreError = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.status === 401) {
      clearSession();
      setSession(null);
      setStatus('ready');
    } else {
      setError(err instanceof Error ? err.message : 'Không khôi phục được phiên đăng nhập.');
      setStatus('error');
    }
  }, []);

  const restore = useCallback(async () => {
    setStatus('loading');
    setError('');
    await restoreStoredSession().then(handleRestored, handleRestoreError);
  }, [handleRestored, handleRestoreError]);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeSession(setSession);
    void restoreStoredSession().then(
      (saved) => { if (active) handleRestored(saved); },
      (err) => { if (active) handleRestoreError(err); },
    );
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'chatapp-session' || event.key === null) void restore();
    };
    window.addEventListener('storage', onStorage);
    return () => { active = false; unsubscribe(); window.removeEventListener('storage', onStorage); };
  }, [restore, handleRestored, handleRestoreError]);

  async function signIn(email: string, password: string) {
    const result = await login(email.trim().toLowerCase(), password);
    saveSession(result);
    setSession(result);
    setError('');
    setStatus('ready');
  }

  async function signOut() {
    const saved = loadSession();
    try { clearSession(); } finally { setSession(null); setStatus('ready'); setError(''); }
    if (saved) await logout(saved.refreshToken).catch(() => undefined);
  }

  return <AuthContext.Provider value={{ user: session?.user ?? null, status, error, signIn, signOut, updateUser: updateSessionUser, restore }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth cần nằm trong AuthProvider.');
  return context;
}
