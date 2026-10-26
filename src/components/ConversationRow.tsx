import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../core/theme';
import UserAvatar from './ui/UserAvatar';

type Props = {
  userId: string;
  name: string;
  lastMessage: string;
  selected: boolean;
  unreadCount: number;
  onPress: () => void;
};

export default function ConversationRow({
  userId,
  name,
  lastMessage,
  selected,
  unreadCount,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Mở cuộc trò chuyện với ${name}${unreadCount > 0 ? `, ${unreadCount} tin chưa đọc` : ''}`}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.row,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <UserAvatar userId={userId} name={name} size={46} />

      <View style={styles.content}>
        <Text numberOfLines={1} style={[styles.name, unreadCount > 0 && styles.unread]}>
          {name}
        </Text>

        <Text numberOfLines={1} style={[styles.preview, unreadCount > 0 && styles.unread]}>
          {lastMessage}
        </Text>
      </View>
      {unreadCount > 0 && <View style={styles.badge}><Text style={styles.count}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  selected: {
    backgroundColor: theme.colors.primarySoft,
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  unread: { fontWeight: '700', color: theme.colors.text },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  count: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  preview: {
    color: theme.colors.muted,
    fontSize: 13,
  },
});