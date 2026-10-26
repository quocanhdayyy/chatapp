import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { theme } from '../core/theme';
import UserAvatar from './ui/UserAvatar';
import { useAuth } from '../providers/AuthProvider';
import NotificationsLink from './NotificationsLink';
import MoreMenu from './MoreMenu';
import Brand from './ui/Brand';
import Icon from './ui/Icon';

type HeaderProps = {
  name: string;
  activeSection?: 'home' | 'friends' | 'notifications' | 'profile' | 'work';
  onOpenFriends: () => void;
  onFeed: () => void;
  onLogout: () => void;
  onOpenProfile: () => void;
};

export default function Header({ name, activeSection = 'home', onOpenFriends, onFeed, onLogout, onOpenProfile }: HeaderProps) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();

  return (
    <View style={[styles.header, width < 600 && styles.small]}>
      <Brand compact={width < 600} iconOnly={width < 440} />
      {width >= 960 && (
        <View style={styles.navigation}>
          <Pressable onPress={onFeed} accessibilityRole="button" accessibilityLabel="Trang chủ" accessibilityState={{ selected: activeSection === 'home' }} style={[styles.nav, activeSection === 'home' && styles.activeNav]}>
            <Icon name="home" size={24} color={activeSection === 'home' ? '#315D73' : theme.colors.muted} />
            <Text style={[styles.navText, activeSection === 'home' && styles.activeText]}>Trang chủ</Text>
          </Pressable>
          <Pressable onPress={onOpenFriends} accessibilityRole="button" accessibilityState={{ selected: activeSection === 'friends' }} style={[styles.nav, activeSection === 'friends' && styles.activeNav]}>
            <Icon name="users" size={23} color={activeSection === 'friends' ? '#315D73' : theme.colors.muted} />
            <Text style={[styles.navText, activeSection === 'friends' && styles.activeText]}>Bạn bè</Text>
          </Pressable>
          <Pressable
            onPress={() => router.navigate('/work')}
            accessibilityRole="button"
            accessibilityLabel="Công việc"
            accessibilityState={{ selected: activeSection === 'work' }}
            style={[styles.nav, activeSection === 'work' && styles.activeNav]}
          >
            <Icon name="briefcase" size={23} color={activeSection === 'work' ? '#315D73' : theme.colors.muted} />
            <Text style={[styles.navText, activeSection === 'work' && styles.activeText]}>Công việc</Text>
          </Pressable>
          <NotificationsLink navigation active={activeSection === 'notifications'} />
        </View>
      )}
      <View style={[styles.actions, width < 440 && styles.compactActions]}>
        {width < 960 && (
          <Pressable
            onPress={() => router.navigate('/work')}
            accessibilityRole="button"
            accessibilityLabel="Công việc"
            accessibilityState={{ selected: activeSection === 'work' }}
            style={styles.logout}
          >
            <Icon name="briefcase" size={19} color={activeSection === 'work' ? theme.colors.primary : theme.colors.muted} />
          </Pressable>
        )}
        {width < 960 && <NotificationsLink active={activeSection === 'notifications'} />}
        {width < 960 && <Pressable onPress={onOpenFriends} accessibilityRole="button" accessibilityLabel="Bạn bè" accessibilityState={{ selected: activeSection === 'friends' }} style={styles.logout}><Icon name="users" size={19} color={activeSection === 'friends' ? theme.colors.primary : theme.colors.muted} /></Pressable>}

        <Pressable onPress={onOpenProfile} accessibilityRole="button" accessibilityLabel={`Mở hồ sơ của ${name}`} accessibilityState={{ selected: activeSection === 'profile' }} style={({ pressed }) => [styles.profile, pressed && styles.pressed]}>
          {width >= 1200 && <Text numberOfLines={1} style={styles.name}>{name}</Text>}
          <UserAvatar userId={user?.id} name={name} size={38} />
        </Pressable>
        <MoreMenu onLogout={onLogout} compact={width < 600} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 72, flexShrink: 0, paddingHorizontal: 24, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20 },
  small: { paddingHorizontal: 16, gap: 12 },
  navigation: { flex: 1, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center', height: '100%', gap: 12 },
  nav: { minWidth: 100, paddingHorizontal: 16, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeNav: { borderBottomColor: '#315D73' },
  activeText: { fontSize: 14, color: '#315D73', fontWeight: '600' },
  navText: { fontSize: 14, color: theme.colors.muted },
  compactActions: { gap: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { maxWidth: 150, color: theme.colors.text, fontSize: 13, fontWeight: '500' },
  logout: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.secondary, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.65 },
});
