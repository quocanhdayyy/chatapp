import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import Header from '../../components/Header';
import { theme } from '../../core/theme';
import { useAuth } from '../../providers/AuthProvider';
import ChatScreen from '../../screens/ChatScreen';

export default function ChatRoute() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <View style={styles.page}>
      <Header
        name={user.name}
        activeSection="chat"
        onFeed={() => router.navigate('/')}
        onOpenFriends={() => router.navigate('/friends')}
        onOpenProfile={() => router.navigate('/profile')}
        onLogout={() => { void signOut(); }}
      />

      <ChatScreen key={user.id} user={user} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: 0,
    backgroundColor: theme.colors.background,
  },
});
