import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import type { User } from '../api/auth';
import { getFriends, type FriendEntry } from '../api/friends';
import { uploadImages, type PostImage } from '../api/media';
import { getPosts, type Post } from '../api/posts';
import { getProfile, updateProfile, type Profile } from '../api/profile';
import Header from '../components/Header';
import PostCard from '../components/PostCard';
import PostComposer from '../components/PostComposer';
import PostImages from '../components/PostImages';
import ProfileHero, { type ProfileImageField, type ProfileTab } from '../components/ProfileHero';
import ProfileIntro from '../components/ProfileIntro';
import AppButton from '../components/ui/AppButton';
import Icon from '../components/ui/Icon';
import UserAvatar from '../components/ui/UserAvatar';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews';
import { theme } from '../core/theme';
import { removeImages } from '../storage/media';
import { addPostToFeed, removePostFromFeed, updatePostInFeed } from '../utils/postUpdates';

type Props = { user: User; onBack: () => void; onEdit: () => void; onChangePassword: () => void; onFriends: () => void; onLogout: () => void };

export default function ProfileScreen({ user, onBack, onEdit, onChangePassword, onFriends, onLogout }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [followCounts, setFollowCounts] = useState<{ following: number; followers: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [postsError, setPostsError] = useState('');
  const [friendsError, setFriendsError] = useState('');
  const [tab, setTab] = useState<ProfileTab>('posts');
  const [imageBusy, setImageBusy] = useState<ProfileImageField | null>(null);
  const [imageError, setImageError] = useState('');
  const [notice, setNotice] = useState('');
  const [writeRequest, setWriteRequest] = useState(0);
  const imageBusyRef = useRef(false);
  const mounted = useRef(true);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const contentY = useRef(0);
  const loadVersion = useRef(0);
  const { width } = useWindowDimensions();

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    const [profileResult, postsResult, friendsResult] = await Promise.allSettled([getProfile(user.id), getPosts(), getFriends()]);
    if (!mounted.current || version !== loadVersion.current) return;
    if (profileResult.status === 'fulfilled') { setProfile(profileResult.value); setLoadError(''); }
    else setLoadError(profileResult.reason instanceof Error ? profileResult.reason.message : 'Không tải được hồ sơ.');
    if (postsResult.status === 'fulfilled') { setPosts(postsResult.value.filter((post) => post.authorId === user.id)); setPostsError(''); }
    else setPostsError('Không tải được bài viết cá nhân.');
    if (friendsResult.status === 'fulfilled') {
      setFriends(friendsResult.value.filter((person) => person.relationship === 'friends'));
      setFollowCounts({ following: friendsResult.value.filter((person) => person.isFollowing).length, followers: friendsResult.value.filter((person) => person.followsYou).length });
      setFriendsError('');
    } else { setFollowCounts(null); setFriendsError('Không tải được danh sách bạn bè.'); }
    setLoading(false);
  }, [user.id]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { loadVersion.current += 1; };
  }, [load]));

  useEffect(() => {
    if (writeRequest > 0 && tab === 'posts' && !loading && !postsError) {
      scrollRef.current?.scrollTo({ y: contentY.current, animated: true });
      inputRef.current?.focus();
    }
  }, [writeRequest, tab, loading, postsError]);

  function writePost() { setTab('posts'); setWriteRequest((value) => value + 1); }

  async function changeImage(field: ProfileImageField) {
    if (imageBusyRef.current) return;
    imageBusyRef.current = true;
    setImageBusy(field); setImageError(''); setNotice('');
    let pendingImageId: string | null = null;
    let assetUri: string | null = null;
    try {
      // Gọi bộ chọn ảnh ngay từ thao tác bấm để Safari cho phép mở hộp chọn file.
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false });
      if (result.canceled) return;
      const asset = result.assets[0];
      assetUri = asset.uri;
      if (!mounted.current) return;
      if (!asset.file || asset.width <= 0 || asset.height <= 0) throw new Error('Không đọc được ảnh đã chọn.');
      const [uploaded] = await uploadImages([asset.file]);
      pendingImageId = uploaded.id;
      if (!mounted.current) return;
      const updated = await updateProfile(user.id, { [field]: uploaded.id });
      pendingImageId = null;
      if (mounted.current) { setProfile(updated); setNotice(field === 'coverImageId' ? 'Đã cập nhật ảnh bìa.' : 'Đã cập nhật ảnh đại diện.'); }
    } catch (err) {
      if (mounted.current) setImageError(err instanceof Error ? err.message : 'Không cập nhật được ảnh.');
    } finally {
      if (pendingImageId) await removeImages([pendingImageId]).catch(() => undefined);
      if (assetUri) URL.revokeObjectURL(assetUri);
      imageBusyRef.current = false;
      if (mounted.current) setImageBusy(null);
    }
  }

  const retry = () => { void load(); };
  const ownPhotos: PostImage[] = profile ? [
    ...(profile.avatarImageId ? [{ id: profile.avatarImageId, name: 'Ảnh đại diện' }] : []),
    ...(profile.coverImageId ? [{ id: profile.coverImageId, name: 'Ảnh bìa' }] : []),
    ...posts.flatMap((post) => post.images),
  ].filter((image, index, all) => all.findIndex((item) => item.id === image.id) === index) : [];

  function friendsPanel(preview = false) {
    const displayed = preview ? friends.slice(0, 6) : friends;
    return <View style={styles.card}>
      <View style={styles.cardHeading}><Text style={styles.cardTitle}>Bạn bè</Text><Pressable onPress={preview ? () => setTab('friends') : onFriends} accessibilityRole="button"><Text style={styles.link}>{preview ? 'Xem tất cả' : 'Quản lý bạn bè'}</Text></Pressable></View>
      {friendsError ? <ErrorState message={friendsError} onRetry={retry} /> : loading ? <LoadingState /> : friends.length === 0 ? <Text style={styles.muted}>Bạn chưa có bạn bè.</Text> : <>
        <Text style={styles.muted}>{friends.length} người bạn</Text>
        <View style={styles.friendGrid}>{displayed.map((person) => <View key={person.id} style={styles.friend}><UserAvatar userId={person.id} name={person.name} size={64} /><Text numberOfLines={2} style={styles.friendName}>{person.name}</Text></View>)}</View>
      </>}
    </View>;
  }

  function photosPanel(preview = false) {
    const displayed = preview ? ownPhotos.slice(0, 6) : ownPhotos;
    return <View style={styles.card}>
      <View style={styles.cardHeading}><Text style={styles.cardTitle}>Ảnh</Text>{preview && <Pressable onPress={() => setTab('photos')} accessibilityRole="button"><Text style={styles.link}>Xem tất cả ảnh</Text></Pressable>}</View>
      {postsError ? <ErrorState message={postsError} onRetry={retry} /> : loading ? <LoadingState /> : ownPhotos.length === 0 ? <Text style={styles.muted}>Chưa có ảnh. Bạn có thể thêm ảnh bìa, ảnh đại diện hoặc đăng bài kèm ảnh.</Text> : <PostImages gallery images={displayed} />}
    </View>;
  }

  return <View style={styles.screen}>
    <Header name={profile?.name ?? user.name} activeSection="profile" onFeed={onBack} onOpenFriends={onFriends} onLogout={onLogout} onOpenProfile={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} />
    <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {loadError ? <View style={styles.loadPanel}><ErrorState message={loadError} onRetry={retry} /></View> : !profile ? <LoadingState message="Đang tải hồ sơ…" /> : <>
        <ProfileHero profile={profile} friendCount={friendsError || loading ? null : friends.length}
          followCounts={loading ? null : followCounts}
          onFollowing={() => router.push({ pathname: '/friends', params: { tab: 'following' } })}
          onFollowers={() => router.push({ pathname: '/friends', params: { tab: 'followers' } })} tab={tab} onTab={setTab} busy={imageBusy} onImage={(field) => { void changeImage(field); }} onEdit={onEdit} onPassword={onChangePassword} onWrite={writePost} canWrite={!loading && !postsError} error={imageError} notice={notice} />
        <View onLayout={(event) => { contentY.current = event.nativeEvent.layout.y; }} style={[styles.body, width < 760 && styles.smallBody]}>
          {tab === 'posts' ? <View style={[styles.columns, width < 900 && styles.stacked]}>
            <View style={[styles.sidebar, width < 900 && styles.fullWidth]}>
              <ProfileIntro profile={profile} onEdit={onEdit} />
              {photosPanel(true)}
              {friendsPanel(true)}
            </View>
            <View style={[styles.feed, width < 900 && styles.stackedFeed]}>
              <PostComposer user={{ ...user, name: profile.name }} inputRef={inputRef} disabled={loading || !!postsError} onPublished={(post) => setPosts((current) => addPostToFeed(current, post))} />
              <View style={styles.postHeading}><Text style={styles.cardTitle}>Bài viết{!loading && !postsError ? ` (${posts.length})` : ''}</Text><Pressable onPress={retry} disabled={loading} accessibilityRole="button" accessibilityLabel="Làm mới bài viết cá nhân" style={styles.refresh}><Icon name="refresh" size={18} color={theme.colors.muted} /></Pressable></View>
              {postsError ? <ErrorState message={postsError} onRetry={retry} /> : loading ? <LoadingState /> : posts.length === 0 ? <EmptyState message="Bạn chưa có bài viết nào." /> : posts.map((post) => <PostCard key={post.id} post={post} user={{ ...user, name: profile.name }} onUpdated={(updated) => setPosts((current) => updatePostInFeed(current, updated))} onDeleted={(id) => setPosts((current) => removePostFromFeed(current, id))} onShared={(shared) => {
                setPosts((current) => addPostToFeed(current, shared));
                scrollRef.current?.scrollTo({ y: contentY.current, animated: true });
              }} />)}
            </View>
          </View> : tab === 'about' ? <View style={styles.about}><ProfileIntro profile={profile} onEdit={onEdit} /><AppButton label="Đổi mật khẩu" icon="lock" onPress={onChangePassword} variant="secondary" /></View> : tab === 'friends' ? friendsPanel() : photosPanel()}
        </View>
      </>}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  body: { width: '100%', maxWidth: 1180, padding: 24 },
  smallBody: { padding: 12 },
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: 20 },
  stacked: { flexDirection: 'column-reverse', alignItems: 'stretch' },
  sidebar: { width: 340, gap: 20 },
  fullWidth: { width: '100%' },
  feed: { flex: 1, minWidth: 0 },
  stackedFeed: { flex: 0, width: '100%' },
  card: { width: '100%', backgroundColor: theme.colors.surface, padding: 20, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, gap: 16 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardTitle: { fontSize: 19, fontWeight: '700', color: theme.colors.text },
  link: { color: theme.colors.primary, fontSize: 13, lineHeight: 21 },
  muted: { color: theme.colors.muted, fontSize: 13, lineHeight: 22 },
  postHeading: { backgroundColor: theme.colors.surface, padding: 16, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  refresh: { padding: 6 },
  friendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  friend: { width: 82, alignItems: 'center', gap: 8 },
  friendName: { color: theme.colors.text, fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 20 },
  about: { width: '100%', maxWidth: 760, gap: 16 },
  loadPanel: { width: '100%', maxWidth: 760, padding: 24 },
});
