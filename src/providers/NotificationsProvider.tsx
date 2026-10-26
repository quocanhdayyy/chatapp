import { POSTS_STORAGE_KEY, subscribePostNotifications } from '../storage/posts';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { getNotifications, markAllNotificationsRead, markNotificationRead, type AppNotification } from '../api/notifications';
import { SOCIAL_STORAGE_KEY, subscribeSocialState } from '../storage/social';

type NotificationsValue = {
  notifications: AppNotification[];
  unreadCount: number | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsValue | null>(null);

export function NotificationsProvider({ children }: PropsWithChildren) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const active = useRef(true);
  const requestVersion = useRef(0);
  const mutating = useRef(false);
  const pendingReload = useRef(false);

  const refresh = useCallback(async () => {
    if (mutating.current) { pendingReload.current = true; return; }
    const version = ++requestVersion.current;
    try {
      const items = await getNotifications();
      if (active.current && version === requestVersion.current) {
        setNotifications(items);
        setError('');
      }
    } catch (err) {
      if (active.current && version === requestVersion.current) setError(err instanceof Error ? err.message : 'Không tải được thông báo.');
    } finally {
      if (active.current && version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    active.current = true;
    const initialVersion = ++requestVersion.current;
    void getNotifications().then(
      (items) => {
        if (active.current && initialVersion === requestVersion.current) {
          setNotifications(items);
          setError('');
        }
      },
      (err: unknown) => {
        if (active.current && initialVersion === requestVersion.current) setError(err instanceof Error ? err.message : 'Không tải được thông báo.');
      },
    ).finally(() => {
      if (active.current && initialVersion === requestVersion.current) setLoading(false);
    });
    const unsubscribe = subscribeSocialState(() => {
      // Thao tác đánh dấu đã đọc tự áp dụng kết quả API, không cần tải lặp.
      if (!mutating.current) void refresh();
    });
    const unsubscribePosts = subscribePostNotifications(() => { void refresh(); });
    const onStorage = (event: StorageEvent) => {
      if (event.key === SOCIAL_STORAGE_KEY || event.key === POSTS_STORAGE_KEY || event.key === null) void refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      active.current = false;
      requestVersion.current += 1;
      unsubscribe();
      unsubscribePosts();
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const updateReadState = useCallback(async (action: () => Promise<AppNotification[]>) => {
    if (mutating.current) throw new Error('Đang cập nhật thông báo. Vui lòng chờ.');
    mutating.current = true;
    requestVersion.current += 1;
    try {
      const items = await action();
      if (active.current) {
        setNotifications(items);
        setError('');
        setLoading(false);
      }
    } finally {
      mutating.current = false;
      if (pendingReload.current && active.current) {
        pendingReload.current = false;
        void refresh();
      }
    }
  }, [refresh]);

  const markRead = useCallback((id: string) => updateReadState(() => markNotificationRead(id)), [updateReadState]);
  const markAllRead = useCallback(() => updateReadState(markAllNotificationsRead), [updateReadState]);
  const unreadCount = loading || error ? null : notifications.filter((item) => item.readAt === null).length;

  return <NotificationsContext.Provider value={{ notifications, unreadCount, loading, error, refresh, markRead, markAllRead }}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications cần nằm trong NotificationsProvider.');
  return context;
}
