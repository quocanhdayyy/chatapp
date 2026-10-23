import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { theme } from '../../core/theme';
import AppButton from './AppButton';
import Brand from './Brand';

type Props = PropsWithChildren<{ title: string; onBack?: () => void; busy?: boolean }>;

export default function Page({ title, onBack, busy, children }: Props) {
  const { width } = useWindowDimensions();
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.container, width < 600 && styles.small]} keyboardShouldPersistTaps="handled">
      <View style={styles.top}>
        <Brand compact />
        {onBack && <AppButton label="Quay lại" icon="back" onPress={onBack} variant="secondary" disabled={busy} />}
      </View>
      <View style={[styles.card, width < 600 && styles.smallCard]}>
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background },
  container: { flexGrow: 1, padding: 24, alignItems: 'center', gap: 24 },
  small: { padding: 16, gap: 16 },
  top: { width: '100%', maxWidth: theme.contentWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  card: { width: '100%', maxWidth: theme.contentWidth, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, padding: 28, borderRadius: 8, gap: 24 },
  smallCard: { padding: 20 },
  title: { fontSize: 24, fontWeight: '600', color: theme.colors.text, lineHeight: 32 },
});
