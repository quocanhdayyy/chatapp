import type { AuthSession, User } from '../types/auth';

const STORAGE_KEY = 'chatapp-session';
const listeners = new Set<(session: AuthSession | null) => void>();

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (
      typeof session?.user?.id !== 'string' ||
      typeof session?.user?.name !== 'string' ||
      typeof session?.user?.email !== 'string' ||
      typeof session?.accessToken !== 'string' ||
      typeof session?.refreshToken !== 'string' ||
      typeof session?.expiresAt !== 'number'
    ) return null;
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    throw new Error('Không lưu được phiên đăng nhập trên trình duyệt.');
  }
  listeners.forEach((listener) => listener(session));
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('chatapp-user');
  } catch {
    // Vẫn đưa giao diện về đăng xuất khi trình duyệt chặn storage.
  } finally {
    listeners.forEach((listener) => listener(null));
  }
}

export function subscribeSession(listener: (session: AuthSession | null) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function updateSessionUser(user: User) {
  const session = loadSession();
  if (session && (session.user.id !== user.id || session.user.name !== user.name || session.user.email !== user.email)) {
    saveSession({ ...session, user });
  }
}
