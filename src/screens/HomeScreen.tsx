import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import type { User } from '../api/auth';
import { getPosts, type Post } from '../api/posts';
import CommunitySidebar from '../components/CommunitySidebar';
import CommunityWidgets from '../components/CommunityWidgets';
import Header from '../components/Header';
import PostCard from '../components/PostCard';
import PostComposer from '../components/PostComposer';
import Icon from '../components/ui/Icon';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews';
import { theme } from '../core/theme';
import { addPostToFeed, removePostFromFeed, updatePostInFeed } from '../utils/postUpdates';

type Props = { user: User; onLogout: () => void; onOpenProfile: () => void; onOpenFriends: () => void; initialOwnOnly?: boolean; autoCompose?: boolean };

export default function HomeScreen({ user, onLogout, onOpenProfile, onOpenFriends, initialOwnOnly = false, autoCompose = false }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ownOnly, setOwnOnly] = useState(initialOwnOnly);
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const loadVersion = useRef(0);

  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    setError('');
    try {
      const data = await getPosts();
      if (version === loadVersion.current) setPosts(data);
    } catch {
      if (version === loadVersion.current) setError('Không tải được bảng tin.');
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { loadVersion.current += 1; };
  }, [load]));

  useEffect(() => {
    if (autoCompose && !loading && !error) inputRef.current?.focus();
  }, [autoCompose, loading, error]);

  function writePost() {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    inputRef.current?.focus();
  }

  function openFeed() {
    setOwnOnly(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  const myPosts = posts.filter((post) => post.authorId === user.id);
  const visiblePosts = ownOnly ? myPosts : posts;
  const showSidebar = width >= 960;
  const showWidgets = width >= 1320;

  return (
    <View style={styles.shell}>
      <Header onOpenFriends={onOpenFriends} name={user.name} onFeed={openFeed} onLogout={onLogout} onOpenProfile={onOpenProfile} />
      <View style={styles.body}>
        {showSidebar && (
          <CommunitySidebar onFriends={onOpenFriends} ownOnly={ownOnly} onFeed={openFeed} onMyPosts={() => setOwnOnly(true)} onProfile={onOpenProfile} onWrite={writePost} />
        )}
        <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={[styles.scrollContent, width < 600 && styles.smallContent]} keyboardShouldPersistTaps="handled">
          <View style={[styles.columns, !showWidgets && styles.singleColumn]}>
            <View style={styles.feed}>
              <PostComposer autoFocus={autoCompose} user={user} inputRef={inputRef} disabled={loading || error !== ''} onPublished={(post) => {
                setPosts((current) => addPostToFeed(current, post));
                setOwnOnly(false);
              }} />
              <View style={styles.feedHeading}>
                <View style={styles.tabs} accessibilityRole="tablist">
                  {([false, true] as const).map((own) => (
                    <Pressable key={String(own)} onPress={() => setOwnOnly(own)} accessibilityRole="tab" accessibilityState={{ selected: ownOnly === own }} style={[styles.tab, ownOnly === own && styles.selectedTab]}>
                      <Text style={[styles.tabText, ownOnly === own && styles.selectedText]}>{own ? 'Bài viết của tôi' : 'Tất cả bài viết'}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable onPress={() => { void load(); }} disabled={loading} accessibilityRole="button" accessibilityLabel="Làm mới bảng tin" style={styles.refresh}>
                  <Icon name="refresh" size={17} color={theme.colors.muted} />
                </Pressable>
              </View>
              {loading ? <LoadingState message="Đang tải bài viết…" /> : error ? (
                <ErrorState message={error} onRetry={() => { void load(); }} />
              ) : visiblePosts.length === 0 ? (
                <EmptyState message={ownOnly ? 'Bạn chưa có bài viết nào.' : 'Chưa có bài viết.'} />
              ) : visiblePosts.map((post) => (
                <PostCard key={post.id} post={post} user={user}
                  onUpdated={(updated) => setPosts((current) => updatePostInFeed(current, updated))}
                  onDeleted={(id) => setPosts((current) => removePostFromFeed(current, id))}
                  onShared={(shared) => {
                    setPosts((current) => addPostToFeed(current, shared));
                    scrollRef.current?.scrollTo({ y: 0, animated: true });
                  }}
                />
              ))}
            </View>
            {showWidgets && (
              <CommunityWidgets userId={user.id} name={user.name} postCount={loading || error ? null : myPosts.length} likes={loading || error ? null : myPosts.reduce((total, post) => total + post.likes, 0)} onProfile={onOpenProfile} />
            )}
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
  scrollContent: { padding: 24, alignItems: 'center', flexGrow: 1 },
  smallContent: { padding: 12 },
  columns: { width: '100%', maxWidth: 1080, flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
  singleColumn: { maxWidth: theme.contentWidth },
  feed: { flex: 1, minWidth: 0 },
  feedHeading: { marginBottom: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tabs: { flexDirection: 'row', gap: 12, flexShrink: 1 },
  tab: { paddingHorizontal: 4, paddingVertical: 17, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  selectedTab: { borderBottomColor: theme.colors.primary },
  tabText: { color: theme.colors.muted, fontSize: 13 },
  selectedText: { color: theme.colors.primary, fontWeight: '600' },
  refresh: { padding: 8 },
});
