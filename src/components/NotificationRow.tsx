import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { AppNotification } from '../api/notifications';
import { theme } from '../core/theme';
import Avatar from './ui/Avatar';
import Icon from './ui/Icon';

type Props = { notification: AppNotification; busy: boolean; disabled: boolean; onOpen: () => void; onRead: () => void };

export default function NotificationRow({ notification, busy, disabled, onOpen, onRead }: Props) {
  const unread = notification.readAt === null;
  const { width } = useWindowDimensions();
  const time = new Date(notification.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <View style={[styles.row, unread && styles.unread, width < 650 && styles.narrow]}>
      <Pressable onPress={onOpen} disabled={disabled} accessibilityRole="button" accessibilityLabel={`${notification.message} ${unread ? 'Chưa đọc.' : 'Đã đọc.'} Mở thông báo`} style={({ pressed }) => [styles.content, pressed && styles.pressed]}>
        {notification.actorName ? <Avatar name={notification.actorName} size={44} /> : <View style={styles.systemIcon}><Icon name="bell" size={22} color={theme.colors.primary} /></View>}
        <View style={styles.text}>
          <Text style={[styles.message, unread && styles.unreadMessage]}>{notification.message}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        {unread && <View style={styles.dot} />}
      </Pressable>
      {unread && <Pressable onPress={onRead} disabled={disabled} accessibilityRole="button" accessibilityLabel={`Đánh dấu đã đọc: ${notification.message}`} style={styles.readButton}>
        <Text style={[styles.readText, disabled && styles.disabled]}>{busy ? 'Đang cập nhật…' : 'Đánh dấu đã đọc'}</Text>
      </Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border, padding: 20, gap: 16 },
  unread: { backgroundColor: '#F1F8F4' },
  narrow: { flexDirection: 'column', alignItems: 'stretch', gap: 10 },
  content: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { flex: 1, minWidth: 0, gap: 7 },
  message: { fontSize: 14, lineHeight: 23, color: theme.colors.text },
  unreadMessage: { fontWeight: '600' },
  time: { fontSize: 12, color: theme.colors.muted, lineHeight: 18 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.primary, flexShrink: 0 },
  systemIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  readButton: { paddingVertical: 8, paddingHorizontal: 4, alignSelf: 'center' },
  readText: { fontSize: 12, color: theme.colors.primary },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
});
