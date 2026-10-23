import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../core/theme';
import AppButton from './ui/AppButton';
import NotificationsLink from './NotificationsLink';
import Icon from './ui/Icon';

type Props = {
  ownOnly?: boolean;
  section?: 'home' | 'friends' | 'notifications';
  onFriends: () => void;
  onFeed: () => void;
  onMyPosts: () => void;
  onProfile: () => void;
  onWrite: () => void;
};

export default function CommunitySidebar({ ownOnly = false, section = 'home', onFriends, onFeed, onMyPosts, onProfile, onWrite }: Props) {
  return (
    <ScrollView style={styles.frame} contentContainerStyle={styles.sidebar}>
      <Text style={styles.heading}>Trang chủ</Text>
      <Pressable onPress={onFeed} accessibilityRole="button" accessibilityState={{ selected: section === 'home' && !ownOnly }} style={({ pressed }) => [styles.nav, section === 'home' && !ownOnly && styles.active, pressed && styles.pressed]}>
        <Icon name="home" color={theme.colors.primary} />
        <Text style={[styles.navText, section === 'home' && !ownOnly && styles.selectedText]}>Bảng tin</Text>
      </Pressable>
      <Pressable onPress={onMyPosts} accessibilityRole="button" accessibilityState={{ selected: section === 'home' && ownOnly }} style={({ pressed }) => [styles.nav, section === 'home' && ownOnly && styles.active, pressed && styles.pressed]}>
        <Icon name="edit" color="#7F6ABB" />
        <Text style={[styles.navText, section === 'home' && ownOnly && styles.selectedText]}>Bài viết của tôi</Text>
      </Pressable>
      <Pressable onPress={onFriends} accessibilityRole="button" accessibilityState={{ selected: section === 'friends' }} style={({ pressed }) => [styles.nav, section === 'friends' && styles.active, pressed && styles.pressed]}>
        <Icon name="users" color="#477FAD" />
        <Text style={[styles.navText, section === 'friends' && styles.selectedText]}>Bạn bè</Text>
      </Pressable>
      <NotificationsLink menu active={section === 'notifications'} />
      <View style={styles.section}>
        <Text style={styles.heading}>Tài khoản</Text>
        <Pressable onPress={onProfile} accessibilityRole="button" style={({ pressed }) => [styles.nav, pressed && styles.pressed]}>
          <Icon name="user" color="#477FAD" />
          <Text style={styles.navText}>Hồ sơ cá nhân</Text>
        </Pressable>
      </View>
      <View style={styles.write}><AppButton label="Tạo bài viết" icon="plus" onPress={onWrite} /></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  frame: { width: 232, flexGrow: 0, flexShrink: 0, backgroundColor: theme.colors.surface, borderRightWidth: 1, borderRightColor: theme.colors.border },
  sidebar: { paddingHorizontal: 16, paddingVertical: 24, gap: 6 },
  heading: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginHorizontal: 12, marginBottom: 10 },
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, borderRadius: 8, gap: 12, minHeight: 48 },
  active: { backgroundColor: theme.colors.secondary },
  navText: { flex: 1, color: theme.colors.text, fontSize: 14 },
  selectedText: { fontWeight: '600' },
  section: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 24, marginTop: 18, gap: 6 },
  write: { marginTop: 24, marginHorizontal: 8 },
  pressed: { opacity: 0.65 },
});
