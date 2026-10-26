import { theme } from '../core/theme';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { User } from '../api/auth';
import CommentCard from './shared/CommentCard';
import {
  createComment,
  deleteComment,
  getComments,
  MAX_COMMENT_LENGTH,
  type Comment,
} from '../api/comments';

type CommentsSectionProps = {
  postId: string;
  user: User;
  disabled?: boolean;
  expanded: boolean;
  onCountChange: (count: number) => void;
};

export default function CommentsSection({
  postId,
  user,
  disabled = false,
  expanded,
  onCountChange,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const busy = sending || deletingId !== null || disabled;

  useEffect(() => {
    if (!expanded) return;
    let active = true;

    async function load() {
      setConfirmDeleteId(null);
      setError('');
      setLoading(true);
      setLoadError('');

      try {
        const data = await getComments(postId);
        if (active) {
          setComments(data);
          onCountChange(data.length);
        }
      } catch (err) {
        if (active) setLoadError(err instanceof Error ? err.message : 'Không tải được bình luận.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [expanded, postId, reload, onCountChange]);

  async function handleSend() {
    if (busy || loading || loadError) return;
    setError('');

    if (!content.trim()) {
      setError('Vui lòng nhập nội dung bình luận.');
      return;
    }

    setSending(true);
    try {
      const comment = await createComment(user, postId, content);
      setComments((current) => [...current, comment]);
      onCountChange(comments.length + 1);
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được bình luận.');
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (busy || loading) return;
    setDeletingId(commentId);
    setError('');

    try {
      await deleteComment(user.id, postId, commentId);
      setComments((current) => current.filter((comment) => comment.id !== commentId));
      onCountChange(Math.max(0, comments.length - 1));
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xóa được bình luận.');
    } finally {
      setDeletingId(null);
    }
  }

  if (!expanded) return null;

  return (
    <View style={styles.body}>
      {loading ? (
        <ActivityIndicator color={theme.colors.primary} accessibilityLabel="Đang tải bình luận" />
      ) : loadError ? (
        <View>
          <Text style={styles.error} accessibilityRole="alert">{loadError}</Text>
          <Pressable onPress={() => setReload((current) => current + 1)} disabled={busy} accessibilityRole="button">
            <Text style={styles.link}>Thử tải lại</Text>
          </Pressable>
        </View>
      ) : comments.length === 0 ? (
        <Text style={styles.muted}>Chưa có bình luận. Hãy viết bình luận đầu tiên!</Text>
      ) : (
        comments.map((comment) => (
          <CommentCard key={comment.id} authorId={comment.authorId} author={comment.author} content={comment.content}>

            {comment.authorId === user.id && (
              confirmDeleteId === comment.id ? (
                <View style={styles.confirmation}>
                  <Text>Xóa bình luận này?</Text>
                  <View style={styles.actions}>
                    <Pressable onPress={() => handleDelete(comment.id)} disabled={busy} accessibilityRole="button" accessibilityLabel="Xác nhận xóa bình luận">
                      <Text style={styles.danger}>{deletingId === comment.id ? 'Đang xóa…' : 'Xác nhận xóa'}</Text>
                    </Pressable>
                    <Pressable onPress={() => setConfirmDeleteId(null)} disabled={busy} accessibilityRole="button">
                      <Text style={styles.link}>Hủy</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable onPress={() => { setError(''); setConfirmDeleteId(comment.id); }} disabled={busy} accessibilityRole="button" accessibilityLabel="Xóa bình luận">
                  <Text style={styles.deleteLink}>Xóa</Text>
                </Pressable>
              )
            )}
          </CommentCard>
        ))
      )}

      <TextInput
        style={styles.input}
        placeholder="Viết bình luận…"
        placeholderTextColor={theme.colors.subtle}
        value={content}
        onChangeText={(value) => { setContent(value); setError(''); }}
        multiline
        maxLength={MAX_COMMENT_LENGTH}
        editable={!busy && !loading && !loadError}
        accessibilityLabel="Nội dung bình luận"
      />

      <View style={styles.actions}>
        <Text style={styles.muted}>{content.length}/{MAX_COMMENT_LENGTH} ký tự</Text>
        <Pressable
          onPress={handleSend}
          disabled={busy || loading || !!loadError || !content.trim()}
          style={[styles.button, (busy || loading || !!loadError || !content.trim()) && styles.disabled]}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{sending ? 'Đang gửi…' : 'Gửi bình luận'}</Text>
        </Pressable>
      </View>
      {error !== '' && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  link: { color: theme.colors.primary, fontWeight: '600', fontSize: 12 },
  body: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 18, gap: 15, marginTop: 5 },
  muted: { color: theme.colors.muted, fontSize: 11, lineHeight: 19 },
  deleteLink: { color: theme.colors.error, fontSize: 10, paddingVertical: 4 },
  danger: { color: theme.colors.error, fontWeight: '600', fontSize: 12 },
  confirmation: { gap: 8, marginTop: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  input: { minHeight: 77, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 13, fontSize: 13, lineHeight: 22, textAlignVertical: 'top', color: theme.colors.text, backgroundColor: theme.colors.background },
  button: { backgroundColor: theme.colors.primary, borderRadius: 11, paddingVertical: 11, paddingHorizontal: 15 },
  buttonText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: 11 },
  disabled: { opacity: 0.45 },
  error: { color: theme.colors.error, fontSize: 12, lineHeight: 21 },
});
