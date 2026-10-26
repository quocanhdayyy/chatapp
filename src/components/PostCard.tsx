import { theme } from '../core/theme';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { User } from '../api/auth';
import { deletePost, MAX_POST_LENGTH, toggleLike, updatePost, type Post } from '../api/posts';
import CommentsSection from './CommentsSection';
import PostImages from './PostImages';
import SharePostDialog from './SharePostDialog';
import SharedPostPreview from './SharedPostPreview';
import AppButton from './ui/AppButton';
import UserAvatar from './ui/UserAvatar';
import Icon from './ui/Icon';

type PostCardProps = {
  post: Post;
  user: User;
  onUpdated: (post: Post) => void;
  onDeleted: (postId: string) => void;
  onShared: (post: Post) => void;
};

export default function PostCard({
  post,
  user,
  onUpdated,
  onDeleted,
  onShared,
}: PostCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState<'' | 'saving' | 'deleting' | 'liking'>('');
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);
  const [notice, setNotice] = useState('');

  const currentUserId = user.id;
  const isOwner = post.authorId === currentUserId;
  const liked = post.likedBy.includes(currentUserId);
  const canShare = !post.sharedPostId || !!post.sharedPost;

  useFocusEffect(useCallback(() => {
    return () => { setSharing(false); };
  }, []));

  function handleEdit() {
    if (busy) return;
    setDraft(post.content);
    setError('');
    setConfirmingDelete(false);
    setEditing(true);
  }

  function handleCancel() {
    setError('');
    setEditing(false);
    setConfirmingDelete(false);
  }

  async function handleSave() {
    if (busy) return;
    setBusy('saving');
    setError('');

    try {
      const updatedPost = await updatePost(currentUserId, post.id, draft);
      onUpdated(updatedPost);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không sửa được bài viết.');
    } finally {
      setBusy('');
    }
  }

  async function handleLike() {
    if (busy) return;
    setBusy('liking');
    setError('');

    try {
      const updatedPost = await toggleLike(currentUserId, post.id);
      onUpdated(updatedPost);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được lượt thích.');
    } finally {
      setBusy('');
    }
  }

  async function handleDelete() {
    if (busy) return;
    setBusy('deleting');
    setError('');

    try {
      await deletePost(currentUserId, post.id);
      onDeleted(post.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xóa được bài viết.');
    } finally {
      setBusy('');
    }
  }

  const displayName = isOwner ? user.name : post.author;

  return <View style={styles.card}>
    <View style={styles.header}>
      <UserAvatar userId={post.authorId} name={displayName} size={43} />
      <View style={styles.identity}><Text style={styles.author}>{displayName}</Text><Text style={styles.meta}>{post.sharedPostId ? 'Đã chia sẻ bài viết' : isOwner ? 'Bài viết của bạn' : 'Thành viên'}</Text></View>
      {isOwner && !editing && !confirmingDelete && <View style={styles.ownerActions}>
        <Pressable onPress={handleEdit} disabled={!!busy} accessibilityRole="button" accessibilityLabel="Sửa bài viết" style={styles.iconButton}><Icon name="edit" size={16} color={theme.colors.muted} /></Pressable>
        <Pressable onPress={() => { setError(''); setConfirmingDelete(true); }} disabled={!!busy} accessibilityRole="button" accessibilityLabel="Xóa bài viết" style={styles.iconButton}><Icon name="trash" size={16} color={theme.colors.muted} /></Pressable>
      </View>}
    </View>
    {editing ? <View style={styles.editor}>
      <TextInput style={styles.input} value={draft} onChangeText={setDraft} multiline maxLength={MAX_POST_LENGTH} editable={!busy} accessibilityLabel="Sửa nội dung bài viết" />
      <Text style={styles.counter}>{draft.length}/{MAX_POST_LENGTH} ký tự</Text>
      <View style={styles.actions}><AppButton label="Lưu thay đổi" icon="check" onPress={handleSave} loading={busy === 'saving'} disabled={!!busy} /><AppButton label="Hủy" onPress={handleCancel} disabled={!!busy} variant="secondary" /></View>
    </View> : !!post.content && <Text style={styles.content}>{post.content}</Text>}
    <PostImages images={post.images} />
    {!!post.sharedPostId && <SharedPostPreview post={post.sharedPost} />}
    {!editing && !confirmingDelete && <View style={styles.reactions}>
      <View style={styles.reactionRow}>
      <Pressable style={[styles.likeButton, liked && styles.likedButton, !!busy && styles.disabled]} onPress={handleLike} disabled={!!busy} accessibilityRole="button" accessibilityLabel={liked ? 'Bỏ thích bài viết' : 'Thích bài viết'} accessibilityState={{ selected: liked, disabled: !!busy }}>
        <Icon name="heart" size={18} color={liked ? theme.colors.accent : theme.colors.muted} filled={liked} /><Text style={[styles.likeText, liked && styles.likedText]}>{busy === 'liking' ? 'Đang cập nhật…' : liked ? 'Đã thích' : 'Thích'}</Text><View style={styles.countDivider} /><Text style={[styles.likeCount, liked && styles.likedText]}>{post.likes}</Text>
      </Pressable>
        <Pressable
          onPress={() => { setNotice(''); setSharing(true); }}
          disabled={!!busy || !canShare}
          accessibilityRole="button"
          accessibilityLabel="Chia sẻ bài viết"
          accessibilityState={{ disabled: !!busy || !canShare }}
          style={[styles.likeButton, (!!busy || !canShare) && styles.disabled]}
        >
          <Icon name="share" size={18} color={theme.colors.muted} />
          <Text style={styles.likeText}>Chia sẻ{post.shareCount ? ` (${post.shareCount})` : ''}</Text>
        </Pressable>
      </View>
      <CommentsSection postId={post.id} user={user} disabled={!!busy} />
    </View>}
    {confirmingDelete && <View style={styles.confirmation}><Text style={styles.confirmText}>Bạn muốn xóa bài viết này?</Text><View style={styles.actions}><AppButton label="Xác nhận xóa" icon="trash" onPress={handleDelete} loading={busy === 'deleting'} disabled={!!busy} variant="danger" /><AppButton label="Hủy" onPress={handleCancel} disabled={!!busy} variant="secondary" /></View></View>}
    {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
    {!!notice && <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text>}
    {sharing && <SharePostDialog post={post} user={user} onClose={() => setSharing(false)} onShared={(created) => {
      onShared(created);
      setNotice('Đã chia sẻ bài viết lên bảng tin của bạn.');
    }} />}
  </View>;
}

const styles = StyleSheet.create({
  card: { width: '100%', backgroundColor: theme.colors.surface, padding: 20, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  identity: { flex: 1, minWidth: 0, gap: 6 },
  author: { color: theme.colors.text, fontSize: 14, fontWeight: '600', lineHeight: 21 },
  meta: { color: theme.colors.subtle, fontSize: 12, lineHeight: 18 },
  ownerActions: { flexDirection: 'row', gap: 6 },
  iconButton: { height: 32, width: 32, borderRadius: 10, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  content: { fontSize: 15, marginTop: 16, marginBottom: 3, lineHeight: 25, color: theme.colors.text },
  reactions: { borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: 21, paddingTop: 16 },
  reactionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  notice: { color: theme.colors.success, marginTop: 12, fontSize: 13, lineHeight: 21 },
  likeButton: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, backgroundColor: theme.colors.surface, flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 40 },
  likedButton: { backgroundColor: theme.colors.accentSoft },
  likeText: { color: theme.colors.muted, fontSize: 12, fontWeight: '600' },
  likedText: { color: theme.colors.accent },
  likeCount: { color: theme.colors.muted, fontSize: 12 },
  countDivider: { width: 1, height: 13, backgroundColor: theme.colors.border },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  editor: { marginTop: 20 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, padding: 14, minHeight: 125, fontSize: 15, lineHeight: 25, textAlignVertical: 'top', backgroundColor: theme.colors.background, color: theme.colors.text },
  counter: { color: theme.colors.muted, fontSize: 11, marginVertical: 12 },
  confirmation: { marginTop: 20, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 20, gap: 15 },
  confirmText: { color: theme.colors.text, fontSize: 14 },
  disabled: { opacity: 0.45 },
  error: { color: theme.colors.error, marginTop: 14, fontSize: 13, lineHeight: 21 },
});
