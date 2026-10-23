import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../core/theme';
import UserAvatar from './ui/UserAvatar';
import Icon from './ui/Icon';

type Props = { userId: string; name: string; postCount: number | null; likes: number | null; onProfile: () => void };

export default function CommunityWidgets({ userId, name, postCount, likes, onProfile }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Hồ sơ của tôi</Text>
      <View style={styles.identity}>
        <UserAvatar userId={userId} name={name} size={44} />
        <View style={styles.identityText}>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          <Text style={styles.caption}>Thành viên</Text>
        </View>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}><Text style={styles.number}>{postCount ?? '—'}</Text><Text style={styles.caption}>Bài viết</Text></View>
        <View style={styles.stat}><Text style={styles.number}>{likes ?? '—'}</Text><Text style={styles.caption}>Lượt thích</Text></View>
      </View>
      <Pressable onPress={onProfile} accessibilityRole="button" style={styles.link}>
        <Text style={styles.linkText}>Xem hồ sơ</Text>
        <Icon name="chevron" size={16} color={theme.colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 260, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8 },
  heading: { fontSize: 14, fontWeight: '600', color: theme.colors.text, padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  identityText: { flex: 1, gap: 5 },
  name: { fontSize: 14, fontWeight: '600', color: theme.colors.text, lineHeight: 21 },
  caption: { fontSize: 12, color: theme.colors.muted },
  stats: { flexDirection: 'row', marginHorizontal: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: theme.colors.border },
  stat: { flex: 1, alignItems: 'center', gap: 6 },
  number: { fontSize: 20, fontWeight: '600', color: theme.colors.text },
  link: { borderTopWidth: 1, borderTopColor: theme.colors.border, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkText: { color: theme.colors.primary, fontSize: 13, fontWeight: '500' },
});
