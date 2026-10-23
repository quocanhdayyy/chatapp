import { router } from 'expo-router';
import { useAuth } from '../../../providers/AuthProvider';
import ChangePasswordScreen from '../../../screens/ChangePasswordScreen';

export default function PasswordRoute() {
  const { user } = useAuth();
  if (!user) return null;
  return <ChangePasswordScreen userId={user.id} onBack={() => router.replace('/profile')} />;
}
