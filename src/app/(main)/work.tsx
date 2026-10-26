import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Header from '../../components/Header';
import { theme } from '../../core/theme';
import { useAuth } from '../../providers/AuthProvider';

export default function WorkRoute() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  return (
    <View style={styles.page}>
      <Header
        name={user.name}
        activeSection="work"
        onFeed={() => router.navigate('/')}
        onOpenFriends={() => router.navigate('/friends')}
        onOpenProfile={() => router.navigate('/profile')}
        onLogout={() => { void signOut(); }}
      />
      <View style={styles.content} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 },
});
