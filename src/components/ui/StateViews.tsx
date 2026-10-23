import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../core/theme';
import AppButton from './AppButton';

export function LoadingState({ message = 'Đang tải…' }: { message?: string }) {
  return <View style={styles.state} accessibilityLiveRegion="polite"><ActivityIndicator color={theme.colors.primary} /><Text style={styles.muted}>{message}</Text></View>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <View style={[styles.state, styles.panel]}><Text style={styles.error} accessibilityRole="alert">{message}</Text>{onRetry && <AppButton label="Thử lại" icon="refresh" onPress={onRetry} variant="secondary" />}</View>;
}

export function EmptyState({ message = 'Chưa có dữ liệu.' }: { message?: string }) {
  return <View style={[styles.state, styles.panel]}><Text style={styles.muted}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  state: { padding: 32, gap: 16, alignItems: 'center' },
  panel: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, backgroundColor: theme.colors.surface },
  muted: { color: theme.colors.muted, textAlign: 'center', fontSize: 14, lineHeight: 22 },
  error: { color: theme.colors.error, textAlign: 'center', lineHeight: 22, fontSize: 14 },
});
