import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import type { User } from '../api/auth';
import { MAX_POST_LENGTH, sharePost, type Post } from '../api/posts';
import { theme } from '../core/theme';
import SharedPostPreview from './SharedPostPreview';
import AppButton from './ui/AppButton';
import Icon from './ui/Icon';
import UserAvatar from './ui/UserAvatar';

type Props = { post: Post; user: User; onClose: () => void; onShared: (post: Post) => void };

export default function SharePostDialog({ post, user, onClose, onShared }: Props) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const sendingRef = useRef(false);
  const mounted = useRef(true);
  const { height } = useWindowDimensions();
  const original = post.sharedPostId ? post.sharedPost : post;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  function close() {
    if (!sendingRef.current) onClose();
  }

  async function publish() {
    // Chặn cả hai lần nhấn liên tiếp trước khi React kịp cập nhật nút.
    if (sendingRef.current || !original) return;
    sendingRef.current = true;
    setSending(true);
    setError('');
    try {
      const created = await sharePost(user, post.id, content);
      if (mounted.current) {
        onShared(created);
        onClose();
      }
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Không chia sẻ được bài viết. Hãy thử lại.');
    } finally {
      sendingRef.current = false;
      if (mounted.current) setSending(false);
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable onPress={close} disabled={sending} style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Đóng cửa sổ chia sẻ" />
        <View style={[styles.dialog, { maxHeight: Math.max(120, height - 32) }]}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>Chia sẻ bài viết</Text>
            <Pressable onPress={close} disabled={sending} style={styles.close} accessibilityRole="button" accessibilityLabel="Đóng cửa sổ chia sẻ">
              <Icon name="close" size={20} color={theme.colors.muted} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.identity}>
              <UserAvatar userId={user.id} name={user.name} size={42} />
              <View style={styles.nameArea}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.muted}>Đăng lên bảng tin của bạn</Text>
              </View>
            </View>
            <TextInput
              autoFocus
              multiline
              value={content}
              onChangeText={(value) => { setContent(value); setError(''); }}
              maxLength={MAX_POST_LENGTH}
              editable={!sending}
              placeholder="Viết thêm lời nhắn (không bắt buộc)…"
              placeholderTextColor={theme.colors.subtle}
              accessibilityLabel="Lời nhắn khi chia sẻ"
              style={styles.input}
            />
            {!!content.length && <Text style={styles.counter}>{content.length}/{MAX_POST_LENGTH} ký tự</Text>}
            <SharedPostPreview post={original} compact />
          </ScrollView>
          <View style={styles.footer}>
            {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
            <View style={styles.actions}>
              <AppButton label="Hủy" onPress={close} disabled={sending} variant="secondary" />
              <AppButton label={sending ? 'Đang chia sẻ…' : 'Chia sẻ'} icon="share" onPress={publish} loading={sending} disabled={!original || sending} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.35)' },
  dialog: { width: '100%', maxWidth: 560, backgroundColor: theme.colors.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { color: theme.colors.text, fontWeight: '600', fontSize: 18 },
  close: { padding: 8 },
  body: { padding: 20 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nameArea: { flex: 1, minWidth: 0, gap: 4 },
  name: { color: theme.colors.text, fontWeight: '600', fontSize: 14, lineHeight: 21 },
  muted: { color: theme.colors.muted, fontSize: 12, lineHeight: 20 },
  input: { marginTop: 16, minHeight: 96, padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, textAlignVertical: 'top', color: theme.colors.text, fontSize: 14, lineHeight: 23 },
  counter: { color: theme.colors.muted, fontSize: 11, marginTop: 8, textAlign: 'right' },
  footer: { borderTopWidth: 1, borderTopColor: theme.colors.border, padding: 16, gap: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10 },
  error: { color: theme.colors.error, fontSize: 13, lineHeight: 21 },
});
