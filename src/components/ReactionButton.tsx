import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { ReactionType } from '../api/posts';
import { theme } from '../core/theme';
import Icon from './ui/Icon';

type Props = { value: ReactionType | null; disabled?: boolean; loading?: boolean; onReact: (reaction: ReactionType) => void };

export default function ReactionButton({ value, disabled = false, loading = false, onReact }: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 80, width: 220 });
  const anchor = useRef<ComponentRef<typeof View>>(null);
  const { width, height } = useWindowDimensions();
  const blocked = disabled || loading;
  const label = value === 'heart' ? 'Tim' : 'Thích';
  const color = value ? theme.colors[value] : theme.colors.muted;

  useFocusEffect(useCallback(() => () => { setOpen(false); }, []));

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, [open]);

  function showPicker() {
    if (blocked) return;
    anchor.current?.measureInWindow((x, y, _buttonWidth, buttonHeight) => {
      const menuWidth = Math.min(220, width - 24);
      setPosition({
        left: Math.max(12, Math.min(x, width - menuWidth - 12)),
        top: y >= 84 ? y - 76 : Math.max(8, Math.min(y + buttonHeight + 8, height - 76)),
        width: menuWidth,
      });
      setOpen(true);
    });
  }

  function choose(reaction: ReactionType) {
    if (blocked) return;
    setOpen(false);
    onReact(reaction);
  }

  return (
    <View ref={anchor} collapsable={false} style={[styles.group, value === 'like' && styles.liked, value === 'heart' && styles.hearted, blocked && styles.disabled]}>
      <Pressable
        onPress={() => onReact(value ?? 'like')}
        onLongPress={showPicker}
        disabled={blocked}
        accessibilityRole="button"
        accessibilityLabel={value ? `Bỏ cảm xúc ${label}` : 'Thích bài viết'}
        accessibilityState={{ selected: !!value, disabled: blocked, busy: loading }}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        {loading ? <ActivityIndicator size="small" color={color} /> : <Icon name={value === 'heart' ? 'heart' : 'thumb'} size={17} color={color} filled={!!value} />}
        <Text numberOfLines={1} style={[styles.label, { color }]}>{label}</Text>
      </Pressable>
      <Pressable
        onPress={showPicker}
        disabled={blocked}
        accessibilityRole="button"
        accessibilityLabel="Chọn cảm xúc Thích hoặc Tim"
        accessibilityState={{ expanded: open, disabled: blocked }}
        style={({ pressed }) => [styles.expand, pressed && styles.pressed]}
      >
        <Icon name="down" size={12} color={color} />
      </Pressable>
      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Đóng chọn cảm xúc" />
          <View style={[styles.picker, position]}>
            {(['like', 'heart'] as const).map((reaction) => (
              <Pressable
                key={reaction}
                onPress={() => choose(reaction)}
                disabled={blocked}
                accessibilityRole="button"
                accessibilityLabel={reaction === 'like' ? 'Chọn Thích' : 'Chọn Tim'}
                accessibilityHint="Chọn lại cảm xúc đang dùng để bỏ cảm xúc"
                accessibilityState={{ selected: value === reaction, disabled: blocked }}
                style={({ pressed }) => [styles.choice, value === reaction && (reaction === 'like' ? styles.liked : styles.hearted), pressed && styles.pressed]}
              >
                <Icon name={reaction === 'like' ? 'thumb' : 'heart'} size={23} color={theme.colors[reaction]} filled={value === reaction} />
                <Text style={[styles.choiceLabel, { color: theme.colors[reaction] }]}>{reaction === 'like' ? 'Thích' : 'Tim'}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flex: 1, minWidth: 0, minHeight: 40, flexDirection: 'row', alignItems: 'stretch', borderRadius: 6 },
  main: { flex: 1, minWidth: 0, paddingHorizontal: 4, minHeight: 40, flexDirection: 'row', gap: 5, justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  label: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  expand: { width: 20, justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  liked: { backgroundColor: '#EDF4F8' },
  hearted: { backgroundColor: '#FDEFF2' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.65 },
  overlay: { flex: 1 },
  picker: { position: 'absolute', flexDirection: 'row', gap: 8, padding: 8, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' },
  choice: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, borderRadius: 6 },
  choiceLabel: { fontSize: 14, fontWeight: '600' },
});
