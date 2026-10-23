import { router } from 'expo-router';
import { useAuth } from '../../../providers/AuthProvider';
import ProfileScreen from '../../../screens/ProfileScreen';

export default function ProfileRoute() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return <ProfileScreen user={user} onBack={() => router.navigate('/')} onFriends={() => router.navigate('/friends')}
    onEdit={() => router.push('/profile/edit')} onChangePassword={() => router.push('/profile/password')}
    onLogout={() => { void signOut(); }}
  />;
}
