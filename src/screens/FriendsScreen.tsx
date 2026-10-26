import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import type { User } from '../api/auth';
import { acceptFriendRequest, cancelFriendRequest, declineFriendRequest, followPerson, getFriends, removeFriend, unfollowPerson, sendFriendRequest, type FriendAction, type FriendEntry, type FriendTab } from '../api/friends';
import CommunitySidebar from '../components/CommunitySidebar';
import FriendRow from '../components/FriendRow';
import Header from '../components/Header';
import Icon from '../components/ui/Icon';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews';
import { theme } from '../core/theme';
import { FRIENDS_STORAGE_KEY } from '../storage/friends';

type Props = { initialTab?: FriendTab; user: User; onLogout: () => void; onFeed: () => void; onMyPosts: () => void; onWrite: () => void; onOpenProfile: () => void };
const tabs: { key: FriendTab; label: string }[] = [
  { key: 'friends', label: 'Tất cả bạn bè' },
  { key: 'incoming', label: 'Lời mời nhận' },
  { key: 'outgoing', label: 'Đã gửi' },
  { key: 'following', label: 'Đang theo dõi' },
  { key: 'followers', label: 'Người theo dõi' },
  { key: 'discover', label: 'Tìm bạn' },
];

const actions = { send: sendFriendRequest, accept: acceptFriendRequest, decline: declineFriendRequest, cancel: cancelFriendRequest, remove: removeFriend, follow: followPerson, unfollow: unfollowPerson };
const successMessages: Record<FriendAction, string> = { send: 'Đã gửi lời mời kết bạn.', accept: 'Đã kết bạn và theo dõi nhau.', decline: 'Đã từ chối lời mời.', cancel: 'Đã hủy lời mời đã gửi.', remove: 'Đã hủy kết bạn.', follow: 'Đã theo dõi.', unfollow: 'Đã bỏ theo dõi.' };
const emptyMessages: Record<FriendTab, string> = { friends: 'Bạn chưa có bạn bè. Mở mục Tìm bạn để gửi lời mời.', incoming: 'Không có lời mời kết bạn mới.', outgoing: 'Bạn chưa gửi lời mời kết bạn nào.', discover: 'Chưa có người dùng để hiển thị.', following: 'Bạn chưa theo dõi ai. Mở mục Tìm bạn để theo dõi.', followers: 'Chưa có người theo dõi bạn.' };

function searchable(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
}

export default function FriendsScreen({ initialTab = 'friends', user, onLogout, onFeed, onMyPosts, onWrite, onOpenProfile }: Props) {
  const [people, setPeople] = useState<FriendEntry[]>([]);
  const [tab, setTab] = useState<FriendTab>(initialTab);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState<{ personId: string; action: FriendAction } | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const busyRef = useRef(false);
  const pendingReload = useRef(false);
  const mounted = useRef(true);
  const { width } = useWindowDimensions();

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const data = await getFriends();
        if (active) setPeople(data);
      } catch (err) {
        if (active) setLoadError(err instanceof Error ? err.message : 'Không tải được danh sách bạn bè.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [reload, user.id]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== FRIENDS_STORAGE_KEY && event.key !== null) return;
      if (busyRef.current) pendingReload.current = true;
      else setReload((value) => value + 1);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  async function handleAction(action: FriendAction, person: FriendEntry) {
    if (busyRef.current || loading || loadError) return;
    const target = ['send', 'remove', 'follow', 'unfollow'].includes(action) ? person.id : person.relationId;
    if (!target) return;
    busyRef.current = true;
    setBusy({ personId: person.id, action });
    setError('');
    setNotice('');
    try {
      const updated = await actions[action](target);
      if (mounted.current) {
        setPeople(updated);
        setRemoveId(null);
        setNotice(successMessages[action]);
      }
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Không thực hiện được. Hãy thử lại.');
    } finally {
      busyRef.current = false;
      if (mounted.current) {
        setBusy(null);
        if (pendingReload.current) {
          pendingReload.current = false;
          setReload((value) => value + 1);
        }
      }
    }
  }

  function selectTab(next: FriendTab) {
    setTab(next);
    setQuery('');
    setRemoveId(null);
    setError('');
    setNotice('');
  }

  function refresh() {
    if (busyRef.current || loading) return;
    setError('');
    setNotice('');
    setRemoveId(null);
    setReload((value) => value + 1);
  }

  const search = searchable(query.trim());
  const visible = people.filter((person) => {
    const inTab = tab === 'following' ? person.isFollowing : tab === 'followers' ? person.followsYou
      : tab === 'discover' || person.relationship === tab;
    return inTab && searchable(`${person.name} ${person.email}`).includes(search);
  });
  const counts = {
    friends: people.filter((person) => person.relationship === 'friends').length,
    incoming: people.filter((person) => person.relationship === 'incoming').length,
    outgoing: people.filter((person) => person.relationship === 'outgoing').length,
    discover: people.length,
    following: people.filter((person) => person.isFollowing).length,
    followers: people.filter((person) => person.followsYou).length,
  };

  return (
    <View style={styles.shell}>
      <Header name={user.name} activeSection="friends" onFeed={onFeed} onOpenFriends={() => selectTab('friends')} onLogout={onLogout} onOpenProfile={onOpenProfile} />
      <View style={styles.body}>
        {width >= 960 && <CommunitySidebar section="friends" onFeed={onFeed} onMyPosts={onMyPosts} onFriends={() => selectTab('friends')} onProfile={onOpenProfile} onWrite={onWrite} />}
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, width < 600 && styles.smallContent]} keyboardShouldPersistTaps="handled">
          <View style={styles.page}>
            <View style={styles.heading}>
              <Text style={styles.title} accessibilityRole="header">Bạn bè</Text>
              <Pressable onPress={refresh} disabled={loading || !!busy} accessibilityRole="button" accessibilityLabel="Làm mới danh sách bạn bè" style={styles.refresh}>
                <Icon name="refresh" size={18} color={theme.colors.muted} />
                <Text style={styles.refreshText}>Làm mới</Text>
              </Pressable>
            </View>
            <View style={styles.panel}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabs}>
                <View style={styles.tabList} accessibilityRole="tablist">
                  {tabs.map((item) => <Pressable key={item.key} onPress={() => selectTab(item.key)} disabled={!!busy} accessibilityRole="tab" accessibilityState={{ selected: tab === item.key, disabled: !!busy }} style={[styles.tab, tab === item.key && styles.activeTab]}>
                    <Text style={[styles.tabText, tab === item.key && styles.activeText]}>{item.label}{item.key !== 'discover' && !loading && !loadError ? ` (${counts[item.key]})` : ''}</Text>
                  </Pressable>)}
                </View>
              </ScrollView>
              <View style={styles.searchArea}>
                <View style={styles.search}>
                  <Icon name="search" size={19} color={theme.colors.muted} />
                  <TextInput value={query} onChangeText={setQuery} placeholder={tab === 'discover' ? 'Tìm người theo tên hoặc email' : 'Tìm trong danh sách'} placeholderTextColor={theme.colors.subtle} style={styles.input} accessibilityLabel="Tìm bạn bè theo tên hoặc email" editable={!busy && !loading && !loadError} autoCapitalize="none" autoCorrect={false} />
                  {!!query && <Pressable onPress={() => setQuery('')} disabled={!!busy} accessibilityRole="button" accessibilityLabel="Xóa nội dung tìm kiếm" style={styles.clear}><Icon name="close" size={16} color={theme.colors.muted} /></Pressable>}
                </View>
              </View>
              {!!notice && <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text>}
              {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
              {loading ? <LoadingState message="Đang tải danh sách bạn bè…" /> : loadError ? <ErrorState message={loadError} onRetry={refresh} /> : visible.length === 0 ? <EmptyState message={query.trim() ? 'Không tìm thấy người phù hợp.' : emptyMessages[tab]} /> : visible.map((person) => (
                <FriendRow key={person.id} person={person} busyAction={busy?.personId === person.id ? busy.action : null} disabled={!!busy} confirmingRemove={removeId === person.id}
                  onAction={(action) => { void handleAction(action, person); }}
                  onConfirmRemove={() => setRemoveId(person.id)} onCancelRemove={() => setRemoveId(null)}
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
  content: { padding: 24, alignItems: 'center', flexGrow: 1 },
  smallContent: { padding: 12 },
  page: { width: '100%', maxWidth: 1000 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, marginBottom: 16, gap: 16 },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '600' },
  refresh: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  refreshText: { fontSize: 13, color: theme.colors.muted },
  panel: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, overflow: 'hidden' },
  tabScroll: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tabs: { paddingHorizontal: 16 },
  tabList: { flexDirection: 'row', gap: 16 },
  tab: { paddingHorizontal: 4, paddingVertical: 18, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: theme.colors.primary },
  tabText: { color: theme.colors.muted, fontSize: 14 },
  activeText: { color: theme.colors.primary, fontWeight: '600' },
  searchArea: { padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, paddingHorizontal: 12 },
  input: { flex: 1, minWidth: 0, fontSize: 14, minHeight: 42, paddingVertical: 10, color: theme.colors.text },
  clear: { padding: 6 },
  error: { fontSize: 13, lineHeight: 21, color: theme.colors.error, paddingHorizontal: 20, paddingTop: 16 },
  notice: { fontSize: 13, lineHeight: 21, color: theme.colors.success, paddingHorizontal: 20, paddingTop: 16 },
});
