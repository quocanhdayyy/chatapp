import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { User } from '../api/auth';
import type { AppNotification, NotificationTarget } from '../api/notifications';
import CommunitySidebar from '../components/CommunitySidebar';
import Header from '../components/Header';
import NotificationRow from '../components/NotificationRow';
import AppButton from '../components/ui/AppButton';
import Icon from '../components/ui/Icon';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews';
import { theme } from '../core/theme';
import { useNotifications } from '../providers/NotificationsProvider';

type Props = {
  user: User; onLogout: () => void; onFeed: () => void; onMyPosts: () => void;
  onWrite: () => void; onOpenFriends: () => void; onOpenProfile: () => void;
  onOpenTarget: (target: NotificationTarget) => void;
};

export default function NotificationsScreen({ user, onLogout, onFeed, onMyPosts, onWrite, onOpenFriends, onOpenProfile, onOpenTarget }: Props) {
  const { notifications, unreadCount, loading, error, refresh, markRead, markAllRead } = useNotifications();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const busyRef = useRef(false);
  const { width } = useWindowDimensions();

  async function handleRead(notification: AppNotification, open: boolean) {
    if (busyRef.current) return;
    if (notification.readAt !== null) {
      if (open) onOpenTarget(notification.target);
      return;
    }
    busyRef.current = true;
    setBusy(notification.id);
    setActionError('');
    setNotice('');
    try {
      await markRead(notification.id);
      if (open) onOpenTarget(notification.target);
      else setNotice('Đã đánh dấu thông báo là đã đọc.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không cập nhật được thông báo.');
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }

  async function handleReadAll() {
    if (busyRef.current || !unreadCount) return;
    busyRef.current = true;
    setBusy('all');
    setActionError('');
    setNotice('');
    try {
      await markAllRead();
      setNotice('Đã đọc tất cả thông báo.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không cập nhật được thông báo.');
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }

  async function handleRefresh() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy('refresh');
    setActionError('');
    setNotice('');
    try { await refresh(); }
    finally { busyRef.current = false; setBusy(null); }
  }

  const visible = unreadOnly ? notifications.filter((item) => item.readAt === null) : notifications;

  return (
    <View style={styles.shell}>
      <Header name={user.name} activeSection="notifications" onFeed={onFeed} onOpenFriends={onOpenFriends} onLogout={onLogout} onOpenProfile={onOpenProfile} />
      <View style={styles.body}>
        {width >= 960 && <CommunitySidebar section="notifications" onFeed={onFeed} onMyPosts={onMyPosts} onFriends={onOpenFriends} onProfile={onOpenProfile} onWrite={onWrite} />}
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, width < 600 && styles.smallContent]}>
          <View style={styles.page}>
            <View style={styles.heading}>
              <Text style={styles.title} accessibilityRole="header">Thông báo</Text>
              <AppButton label="Đọc tất cả" icon="check" variant="secondary" onPress={() => { void handleReadAll(); }} loading={busy === 'all'} disabled={loading || !!error || !!busy || !unreadCount} />
            </View>
            <View style={styles.panel}>
              <View style={styles.toolbar}>
                <View style={styles.tabs} accessibilityRole="tablist">
                  {([false, true] as const).map((unread) => <Pressable key={String(unread)} onPress={() => { setUnreadOnly(unread); setNotice(''); }} disabled={!!busy} accessibilityRole="tab" accessibilityState={{ selected: unreadOnly === unread }} style={[styles.tab, unreadOnly === unread && styles.activeTab]}>
                    <Text style={[styles.tabText, unreadOnly === unread && styles.activeText]}>{unread ? `Chưa đọc${unreadCount !== null ? ` (${unreadCount})` : ''}` : 'Tất cả'}</Text>
                  </Pressable>)}
                </View>
                <Pressable onPress={() => { void handleRefresh(); }} disabled={loading || !!busy} accessibilityRole="button" accessibilityLabel="Làm mới thông báo" style={styles.refresh}>
                  <Icon name="refresh" size={18} color={theme.colors.muted} />
                  {busy === 'refresh' && <Text style={styles.refreshText}>Đang tải…</Text>}
                </Pressable>
              </View>
              {!!actionError && <Text style={styles.error} accessibilityRole="alert">{actionError}</Text>}
              {!!notice && <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text>}
              {loading ? <LoadingState message="Đang tải thông báo…" /> : error ? <ErrorState message={error} onRetry={() => { void handleRefresh(); }} /> : visible.length === 0 ? <EmptyState message={unreadOnly ? 'Bạn đã đọc hết thông báo.' : 'Chưa có thông báo.'} /> : visible.map((item) => (
                <NotificationRow key={item.id} notification={item} busy={busy === item.id} disabled={!!busy}
                  onRead={() => { void handleRead(item, false); }} onOpen={() => { void handleRead(item, true); }}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: theme.colors.background },
  body: { flex: 1, minHeight: 0, flexDirection: 'row' },
  scroll: { flex: 1, minWidth: 0 },
  content: { flexGrow: 1, padding: 24, alignItems: 'center' },
  smallContent: { padding: 12 },
  page: { width: '100%', maxWidth: 1000 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '600', color: theme.colors.text },
  panel: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, overflow: 'hidden' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: 12 },
  tabs: { flexDirection: 'row', gap: 24 },
  tab: { paddingVertical: 18, paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: theme.colors.primary },
  tabText: { fontSize: 14, color: theme.colors.muted },
  activeText: { color: theme.colors.primary, fontWeight: '600' },
  refresh: { padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  refreshText: { color: theme.colors.muted, fontSize: 11 },
  error: { color: theme.colors.error, paddingHorizontal: 20, paddingVertical: 16, fontSize: 13, lineHeight: 21 },
  notice: { color: theme.colors.success, paddingHorizontal: 20, paddingVertical: 16, fontSize: 13, lineHeight: 21 },
});
