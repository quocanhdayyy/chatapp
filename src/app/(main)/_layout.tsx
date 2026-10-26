import { Stack } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { NotificationsProvider } from '../../providers/NotificationsProvider';
import { ChatInboxProvider } from '../../providers/ChatInboxProvider';

export default function MainLayout() {
  const { user } = useAuth();
  if (!user) return null;
  return <NotificationsProvider key={user.id}><ChatInboxProvider><Stack screenOptions={{ headerShown: false, animation: 'none' }} /></ChatInboxProvider></NotificationsProvider>;
}
