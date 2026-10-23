import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../core/theme';
import UserAvatar from '../ui/UserAvatar';

type Props = PropsWithChildren<{ authorId?: string; author: string; content: string }>;
export default function CommentCard({ authorId, author, content, children }: Props) {
  return <View style={styles.row}><UserAvatar userId={authorId} name={author} size={31} /><View style={styles.card}><Text style={styles.author}>{author}</Text><Text style={styles.content}>{content}</Text>{children}</View></View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  card: { flex: 1, minWidth: 0, backgroundColor: theme.colors.background, borderRadius: 13, borderTopLeftRadius: 3, padding: 13, gap: 6 },
  author: { fontWeight: '600', fontSize: 12, color: theme.colors.text },
  content: { fontSize: 14, lineHeight: 23, color: theme.colors.text },
});
