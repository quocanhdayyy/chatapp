import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { theme } from '../../core/theme';

type Props = TextInputProps & { label: string; error?: string };

export default function AppTextField({ label, error, style, onFocus, onBlur, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput {...props} onFocus={(event) => { setFocused(true); onFocus?.(event); }} onBlur={(event) => { setFocused(false); onBlur?.(event); }} placeholderTextColor={theme.colors.subtle} accessibilityLabel={props.accessibilityLabel ?? label} style={[styles.input, props.multiline && styles.multiline, focused && styles.focused, !!error && styles.invalid, style]} />
    {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  input: { minHeight: 44, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, padding: 12, fontSize: 15, color: theme.colors.text, backgroundColor: theme.colors.surface },
  focused: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface },
  multiline: { minHeight: 128, textAlignVertical: 'top', lineHeight: 24 },
  invalid: { borderColor: theme.colors.error },
  error: { color: theme.colors.error, fontSize: 13 },
});
