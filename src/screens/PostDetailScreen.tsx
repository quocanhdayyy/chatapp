import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { User } from '../api/auth';
import { getPostById, type Post } from '../api/posts';
import Header from '../components/Header';
import PostCard from '../components/PostCard';
import AppButton from '../components/ui/AppButton';
import { ErrorState, LoadingState } from '../components/ui/StateViews';
import { theme } from '../core/theme';

type Props = {
  postId: string; user: User;
  onFeed: () => void; onFriends: () => void; onProfile: () => void; onLogout: () => void;
  onShared: (post: Post) => void;
};

export default function PostDetailScreen({ postId, user, onFeed, onFriends, onProfile, onLogout, onShared }: Props) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState('');
  const loadVersion = useRef(0);

  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    setError('');
    setMissing(false);
    try {
      if (!postId) throw new Error('Bài viết không còn tồn tại.');
      const item = await getPostById(postId);
      if (version === loadVersion.current) setPost(item);
    } catch (err) {
      if (version !== loadVersion.current) return;
      const message = err instanceof Error ? err.message : 'Không tải được bài viết.';
      setPost(null);
      if (message === 'Bài viết không còn tồn tại.') setMissing(true);
      else setError(message);
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [postId]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { loadVersion.current += 1; };
  }, [load]));

  return <View style={styles.screen}>
    <Header name={user.name} onFeed={onFeed} onOpenFriends={onFriends} onOpenProfile={onProfile} onLogout={onLogout} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.page}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>Bài viết</Text>
          <AppButton label="Về bảng tin" icon="back" onPress={onFeed} variant="secondary" />
        </View>
        {loading ? <LoadingState message="Đang tải bài viết…" /> : missing ? <View style={styles.empty}>
          <Text style={styles.message}>Bài viết không còn tồn tại hoặc đã bị xóa.</Text>
          <AppButton label="Mở bảng tin" onPress={onFeed} />
        </View> : error ? <ErrorState message={error} onRetry={() => { void load(); }} /> : post && <PostCard
          key={post.id} post={post} user={user} initialCommentsExpanded
          onUpdated={setPost} onDeleted={() => { setPost(null); setMissing(true); }} onShared={onShared}
        />}
      </View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, alignItems: 'center', flexGrow: 1 },
  page: { width: '100%', maxWidth: theme.contentWidth },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '600' },
  empty: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 24, alignItems: 'center', gap: 20 },
  message: { color: theme.colors.muted, fontSize: 15, lineHeight: 24, textAlign: 'center' },
});
