import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../../core/theme';
import Icon, { type IconName } from './Icon';

type Props = { label: string; onPress: () => void; loading?: boolean; disabled?: boolean; variant?: 'primary' | 'secondary' | 'danger'; icon?: IconName };

export default function AppButton({ label, onPress, loading = false, disabled = false, variant = 'primary', icon }: Props) {
  const blocked = loading || disabled;
  const color = variant === 'secondary' ? theme.colors.primary : theme.colors.onPrimary;
  return <Pressable onPress={onPress} disabled={blocked} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: blocked, busy: loading }} style={({ pressed }) => [styles.button, variant === 'secondary' ? styles.secondary : variant === 'danger' ? styles.danger : styles.primary, pressed && styles.pressed, blocked && styles.disabled]}>
    {loading ? <ActivityIndicator size="small" color={color} /> : icon && <Icon name={icon} size={18} color={color} />}
    <Text style={[styles.label, { color }]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { minHeight: 42, paddingVertical: 11, paddingHorizontal: 16, borderRadius: theme.radius, borderWidth: 1, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
  danger: { backgroundColor: theme.colors.error, borderColor: theme.colors.error },
  label: { fontWeight: '600', fontSize: 14 },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.48 },
});
