import { Stack } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { NotificationsProvider } from '../../providers/NotificationsProvider';

export default function MainLayout() {
  const { user } = useAuth();
  if (!user) return null;
  return <NotificationsProvider key={user.id}><Stack screenOptions={{ headerShown: false, animation: 'none' }} /></NotificationsProvider>;
}
