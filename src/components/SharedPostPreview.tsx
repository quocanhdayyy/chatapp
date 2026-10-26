import { StyleSheet, Text, View } from 'react-native';
import type { SharedPost } from '../api/posts';
import { theme } from '../core/theme';
import PostImages from './PostImages';
import UserAvatar from './ui/UserAvatar';

type Props = { post: SharedPost | null | undefined; compact?: boolean };

export default function SharedPostPreview({ post, compact = false }: Props) {
  if (!post) {
    return <View style={styles.unavailable}><Text style={styles.muted}>Bài viết gốc không còn tồn tại.</Text></View>;
  }

  return (
    <View style={styles.preview}>
      <View style={styles.identity}>
        <UserAvatar userId={post.authorId} name={post.author} size={36} />
        <View style={styles.nameArea}>
          <Text style={styles.author}>{post.author}</Text>
          <Text style={styles.muted}>Bài viết gốc</Text>
        </View>
      </View>
      {!!post.content && <Text numberOfLines={compact ? 4 : undefined} style={styles.content}>{post.content}</Text>}
      <PostImages images={post.images} gallery={compact} />
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 16, marginTop: 16 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nameArea: { flex: 1, minWidth: 0, gap: 3 },
  author: { color: theme.colors.text, fontWeight: '600', fontSize: 13, lineHeight: 20 },
  content: { marginTop: 12, color: theme.colors.text, fontSize: 14, lineHeight: 23 },
  muted: { color: theme.colors.muted, fontSize: 12, lineHeight: 20 },
  unavailable: { backgroundColor: theme.colors.background, borderRadius: 6, padding: 16, marginTop: 16 },
});
