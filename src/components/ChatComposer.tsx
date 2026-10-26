import { StyleSheet, Text, TextInput, View } from 'react-native';
import { MAX_MESSAGE_LENGTH } from '../core/chat';
import { theme } from '../core/theme';
import AppButton from './ui/AppButton';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  sending: boolean;
  error: string;
};

export default function ChatComposer({ value, onChange, onSend, disabled, sending, error }: Props) {
  const blocked = disabled || sending;

  return (
    <View style={styles.composer}>
      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Nhập tin nhắn…"
          placeholderTextColor={theme.colors.subtle}
          accessibilityLabel="Nội dung tin nhắn"
          editable={!blocked}
          multiline
          maxLength={MAX_MESSAGE_LENGTH}
          style={[styles.input, blocked && styles.disabled]}
          onKeyPress={(event) => {
            const key = event.nativeEvent as typeof event.nativeEvent & {
              shiftKey?: boolean;
              isComposing?: boolean;
              keyCode?: number;
            };

            if (key.key === 'Enter' && !key.shiftKey && !key.isComposing && key.keyCode !== 229) {
              event.preventDefault();
              if (!blocked && value.trim()) onSend();
            }
          }}
        />

        <AppButton
          label={sending ? 'Đang gửi…' : 'Gửi'}
          icon="arrow"
          onPress={onSend}
          loading={sending}
          disabled={blocked || !value.trim() || value.trim().length > MAX_MESSAGE_LENGTH}
        />
      </View>

      <View style={styles.hints}>
        <Text style={styles.hint}>Enter để gửi · Shift + Enter để xuống dòng</Text>
        <Text style={styles.hint}>{value.length}/{MAX_MESSAGE_LENGTH}</Text>
      </View>

      {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  composer: { flexShrink: 0, padding: 16, gap: 8, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  input: { flex: 1, minWidth: 0, minHeight: 44, maxHeight: 120, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, color: theme.colors.text, backgroundColor: theme.colors.background, fontSize: 15, lineHeight: 22, textAlignVertical: 'top' },
  hints: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  hint: { fontSize: 11, color: theme.colors.muted, lineHeight: 17 },
  error: { color: theme.colors.error, fontSize: 13, lineHeight: 20 },
  disabled: { opacity: 0.6 },
});
