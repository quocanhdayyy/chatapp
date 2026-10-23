import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import FriendsScreen from '../../screens/FriendsScreen';

export default function FriendsRoute() {
  const { user, signOut } = useAuth();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const initialTab = tab === 'incoming' || tab === 'outgoing' || tab === 'discover' ? tab : 'friends';
  if (!user) return null;
  return <FriendsScreen key={initialTab} initialTab={initialTab} user={user} onLogout={() => { void signOut(); }}
    onFeed={() => router.push('/')}
    onMyPosts={() => router.push({ pathname: '/', params: { view: 'mine' } })}
    onWrite={() => router.push({ pathname: '/', params: { compose: '1' } })}
    onOpenProfile={() => router.push('/profile')}
  />;
}
