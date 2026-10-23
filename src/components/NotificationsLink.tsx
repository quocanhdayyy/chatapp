import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../core/theme';
import { useNotifications } from '../providers/NotificationsProvider';
import Icon from './ui/Icon';

export default function NotificationsLink({ menu = false, navigation = false, active = false }: { menu?: boolean; navigation?: boolean; active?: boolean }) {
  const { unreadCount } = useNotifications();
  const count = unreadCount ?? 0;
  const label = count > 0 ? `Thông báo, ${count} chưa đọc` : 'Thông báo';

  return (
    <Pressable onPress={() => router.navigate('/notifications')} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }} style={({ pressed }) => [navigation ? styles.navigation : menu ? styles.menu : styles.button, active && (navigation ? styles.activeNavigation : styles.active), pressed && styles.pressed]}>
      <Icon name="bell" size={navigation ? 23 : menu ? 20 : 21} color={active ? (navigation ? '#315D73' : theme.colors.primary) : theme.colors.muted} />
      {(menu || navigation) && <Text style={[navigation ? styles.navigationText : styles.menuText, active && styles.selectedText, navigation && active && styles.activeNavigationText]}>Thông báo</Text>}
      {count > 0 && <View style={[styles.badge, !menu && !navigation && styles.floatingBadge]}><Text style={styles.count}>{count > 99 ? '99+' : count}</Text></View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  navigation: { minWidth: 110, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeNavigation: { borderBottomColor: '#315D73' },
  navigationText: { color: theme.colors.muted, fontSize: 14 },
  activeNavigationText: { color: '#315D73' },
  button: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.secondary, alignItems: 'center', justifyContent: 'center' },
  menu: { flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingHorizontal: 12, paddingVertical: 14, borderRadius: 8, gap: 12 },
  active: { backgroundColor: theme.colors.primarySoft },
  menuText: { flex: 1, color: theme.colors.text, fontSize: 14 },
  selectedText: { fontWeight: '600' },
  badge: { minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D9474B' },
  floatingBadge: { position: 'absolute', top: -3, right: -5 },
  count: { color: '#FFFFFF', fontSize: 10, fontWeight: '600', lineHeight: 14 },
  pressed: { opacity: 0.65 },
});
