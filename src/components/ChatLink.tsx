import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../core/theme';
import { useChatInbox } from '../providers/ChatInboxProvider';
import Icon from './ui/Icon';

export default function ChatLink({ navigation = false, active = false }: { navigation?: boolean; active?: boolean }) {
  const { unreadCount, error } = useChatInbox();
  const count = unreadCount ?? 0;
  const label = error ? 'Tin nhắn, không cập nhật được số chưa đọc' : count ? `Tin nhắn, ${count} tin chưa đọc` : 'Tin nhắn';
  return <Pressable onPress={() => router.navigate('/chat')} accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ selected: active }} style={({ pressed }) => [navigation ? styles.nav : styles.button,
      active && (navigation ? styles.activeNav : styles.active), pressed && styles.pressed]}>
    <Icon name="comment" size={navigation ? 23 : 21} color={active ? navigation ? '#315D73' : theme.colors.primary : theme.colors.muted} />
    {navigation && <Text style={[styles.text, active && styles.activeText]}>Tin nhắn</Text>}
    {(count > 0 || !!error) && <View style={[styles.badge, !navigation && styles.floating]}><Text style={styles.count}>{error ? '!' : count > 99 ? '99+' : count}</Text></View>}
  </Pressable>;
}

const styles = StyleSheet.create({
  nav: { minWidth: 90, paddingHorizontal: 12, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeNav: { borderBottomColor: '#315D73' },
  button: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.secondary, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: theme.colors.primarySoft },
  text: { fontSize: 14, color: theme.colors.muted },
  activeText: { color: '#315D73', fontWeight: '600' },
  badge: { minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#D9474B', alignItems: 'center', justifyContent: 'center' },
  floating: { position: 'absolute', top: -3, right: -5 },
  count: { color: '#FFFFFF', fontSize: 10, lineHeight: 14, fontWeight: '700' },
  pressed: { opacity: 0.65 },
});
