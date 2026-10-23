import { StyleSheet, View } from 'react-native';
import Brand from '../components/ui/Brand';
import { LoadingState } from '../components/ui/StateViews';
import { theme } from '../core/theme';

export default function SplashScreen() {
  return <View style={styles.container}><Brand compact /><LoadingState message="Đang tải…" /></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16, backgroundColor: theme.colors.background },
});
