import { router } from 'expo-router';
import { useAuth } from '../../../providers/AuthProvider';
import EditProfileScreen from '../../../screens/EditProfileScreen';

export default function EditProfileRoute() {
  const { user, updateUser } = useAuth();
  if (!user) return null;
  return <EditProfileScreen userId={user.id} onBack={() => router.replace('/profile')} onSaved={(profile) => { updateUser({ id: profile.id, name: profile.name, email: profile.email }); router.replace('/profile'); }} />;
}
