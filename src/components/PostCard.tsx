import { theme } from '../core/theme';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { User } from '../api/auth';
import { deletePost, getReactionCounts, MAX_POST_LENGTH, toggleReaction, updatePost, type Post, type ReactionType } from '../api/posts';
import CommentsSection from './CommentsSection';
import PostImages from './PostImages';
import ReactionButton from './ReactionButton';
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
  initialCommentsExpanded?: boolean;
};

export default function PostCard({
  post,
  user,
  onUpdated,
  onDeleted,
  onShared,
  initialCommentsExpanded = false,
}: PostCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState<'' | 'saving' | 'deleting' | 'liking'>('');
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);
  const [notice, setNotice] = useState('');
  const [commentsExpanded, setCommentsExpanded] = useState(initialCommentsExpanded);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const reactionBusy = useRef(false);

  const currentUserId = user.id;
  const isOwner = post.authorId === currentUserId;
  const reaction = post.reactions?.[currentUserId] ?? (post.likedBy.includes(currentUserId) ? 'like' : null);
  const counts = getReactionCounts(post);
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

  async function handleReaction(value: ReactionType) {
    if (busy || reactionBusy.current) return;
    reactionBusy.current = true;
    setBusy('liking');
    setError('');

    try {
      const updatedPost = await toggleReaction(currentUserId, post.id, value);
      onUpdated(updatedPost);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được cảm xúc.');
    } finally {
      reactionBusy.current = false;
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
      {(post.likes > 0 || (commentCount ?? 0) > 0 || (post.shareCount ?? 0) > 0) && <View style={styles.summary}>
        <View style={styles.reactionCounts}>
          {counts.like > 0 && <View style={styles.countItem}><Icon name="thumb" size={14} color={theme.colors.like} /><Text style={styles.countText}>{counts.like}</Text></View>}
          {counts.heart > 0 && <View style={styles.countItem}><Icon name="heart" size={14} color={theme.colors.heart} filled /><Text style={styles.countText}>{counts.heart}</Text></View>}
        </View>
        <Text style={styles.countText}>{[
          commentCount ? `${commentCount} bình luận` : '',
          post.shareCount ? `${post.shareCount} chia sẻ` : '',
        ].filter(Boolean).join(' · ')}</Text>
      </View>}
      <View style={styles.reactionRow}>
        <ReactionButton value={reaction} onReact={handleReaction} disabled={!!busy} loading={busy === 'liking'} />
        <Pressable
          onPress={() => setCommentsExpanded((value) => !value)}
          disabled={!!busy}
          accessibilityRole="button"
          accessibilityLabel={commentsExpanded ? 'Ẩn bình luận' : 'Mở bình luận'}
          accessibilityState={{ expanded: commentsExpanded, disabled: !!busy }}
          style={({ pressed }) => [styles.actionButton, commentsExpanded && styles.activeAction, !!busy && styles.disabled, pressed && styles.pressed]}
        >
          <Icon name="comment" size={17} color={commentsExpanded ? theme.colors.primary : theme.colors.muted} />
          <Text numberOfLines={1} style={[styles.actionText, commentsExpanded && styles.activeActionText]}>Bình luận</Text>
        </Pressable>
        <Pressable
          onPress={() => { setNotice(''); setSharing(true); }}
          disabled={!!busy || !canShare}
          accessibilityRole="button"
          accessibilityLabel="Chia sẻ bài viết"
          accessibilityState={{ disabled: !!busy || !canShare }}
          style={({ pressed }) => [styles.actionButton, (!!busy || !canShare) && styles.disabled, pressed && styles.pressed]}
        >
          <Icon name="share" size={17} color={theme.colors.muted} />
          <Text numberOfLines={1} style={styles.actionText}>Chia sẻ</Text>
        </Pressable>
      </View>
      <CommentsSection postId={post.id} user={user} expanded={commentsExpanded} onCountChange={setCommentCount} disabled={!!busy} />
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
  reactions: { marginTop: 20 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  reactionCounts: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  countItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  countText: { color: theme.colors.muted, fontSize: 12, lineHeight: 20 },
  reactionRow: { flexDirection: 'row', alignItems: 'stretch', gap: 4, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 6 },
  actionButton: { flex: 1, minWidth: 0, minHeight: 40, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, paddingHorizontal: 4, borderRadius: 6 },
  actionText: { color: theme.colors.muted, fontSize: 12, fontWeight: '600', flexShrink: 1 },
  activeAction: { backgroundColor: theme.colors.primarySoft },
  activeActionText: { color: theme.colors.primary },
  pressed: { opacity: 0.65 },
  notice: { color: theme.colors.success, marginTop: 12, fontSize: 13, lineHeight: 21 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  editor: { marginTop: 20 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, padding: 14, minHeight: 125, fontSize: 15, lineHeight: 25, textAlignVertical: 'top', backgroundColor: theme.colors.background, color: theme.colors.text },
  counter: { color: theme.colors.muted, fontSize: 11, marginVertical: 12 },
  confirmation: { marginTop: 20, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 20, gap: 15 },
  confirmText: { color: theme.colors.text, fontSize: 14 },
  disabled: { opacity: 0.45 },
  error: { color: theme.colors.error, marginTop: 14, fontSize: 13, lineHeight: 21 },
});
