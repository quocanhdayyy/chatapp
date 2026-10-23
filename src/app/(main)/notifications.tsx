import { router } from 'expo-router';
import type { NotificationTarget } from '../../api/notifications';
import { useAuth } from '../../providers/AuthProvider';
import NotificationsScreen from '../../screens/NotificationsScreen';

export default function NotificationsRoute() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  function openTarget(target: NotificationTarget) {
    if (target.screen === 'friends') router.push({ pathname: '/friends', params: { tab: target.tab } });
    else router.push('/profile');
  }

  return <NotificationsScreen user={user} onLogout={() => { void signOut(); }}
    onFeed={() => router.navigate('/')}
    onMyPosts={() => router.push({ pathname: '/', params: { view: 'mine' } })}
    onWrite={() => router.push({ pathname: '/', params: { compose: '1' } })}
    onOpenFriends={() => router.navigate('/friends')}
    onOpenProfile={() => router.push('/profile')}
    onOpenTarget={openTarget}
  />;
}
