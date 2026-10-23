import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import HomeScreen from '../../screens/HomeScreen';

export default function HomeRoute() {
  const { user, signOut } = useAuth();
  const { view, compose } = useLocalSearchParams<{ view?: string; compose?: string }>();
  if (!user) return null;
  return <HomeScreen key={`${view ?? "all"}-${compose ?? "0"}`} initialOwnOnly={view === 'mine'} autoCompose={compose === '1'} user={user} onOpenFriends={() => router.push('/friends')} onLogout={() => { void signOut(); }} onOpenProfile={() => router.push('/profile')} />;
}
