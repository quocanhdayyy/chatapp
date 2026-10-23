import { useAuth } from '../providers/AuthProvider';
import LoginScreen from '../screens/LoginScreen';

export default function LoginRoute() {
  const { signIn } = useAuth();
  return <LoginScreen onSubmit={signIn} />;
}
