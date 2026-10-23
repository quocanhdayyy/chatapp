import { Stack } from 'expo-router';
import App from '../../App';
import AppButton from '../components/ui/AppButton';
import Page from '../components/ui/Page';
import { ErrorState } from '../components/ui/StateViews';
import { useAuth } from '../providers/AuthProvider';
import SplashScreen from '../screens/SplashScreen';

function Navigation() {
  const { user, status, error, restore, signOut } = useAuth();
  if (status === 'loading') return <SplashScreen />;
  if (status === 'error') return <Page title="Không tải được phiên đăng nhập"><ErrorState message={error} onRetry={() => { void restore(); }} /><AppButton label="Về đăng nhập" onPress={() => { void signOut(); }} variant="secondary" /></Page>;

  return <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
    <Stack.Protected guard={!user}><Stack.Screen name="login" /></Stack.Protected>
    <Stack.Protected guard={!!user}><Stack.Screen name="(main)" /></Stack.Protected>
    <Stack.Screen name="+not-found" />
  </Stack>;
}

export default function RootLayout() { return <App><Navigation /></App>; }
