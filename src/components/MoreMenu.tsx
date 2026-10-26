import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { theme } from '../core/theme';
import Icon, { type IconName } from './ui/Icon';

type Props = { onLogout: () => void; compact?: boolean };

export default function MoreMenu({ onLogout, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 80, width: 264 });
  const anchor = useRef<ComponentRef<typeof View>>(null);
  const { width, height } = useWindowDimensions();

  useFocusEffect(useCallback(() => {
    return () => { setOpen(false); };
  }, []));

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, [open]);

  function showMenu() {
    anchor.current?.measureInWindow((x, y, buttonWidth, buttonHeight) => {
      const menuWidth = Math.min(264, width - 24);
      setPosition({
        width: menuWidth,
        left: Math.max(12, Math.min(x + buttonWidth - menuWidth, width - menuWidth - 12)),
        top: Math.max(12, Math.min(y + buttonHeight + 8, height - 200)),
      });
      setOpen(true);
    });
  }

  function select(action: () => void) {
    setOpen(false);
    action();
  }

  const items: { label: string; icon: IconName; action: () => void }[] = [
    { label: 'Hồ sơ cá nhân', icon: 'user', action: () => router.navigate('/profile') },
    { label: 'Chỉnh sửa hồ sơ', icon: 'edit', action: () => router.navigate('/profile/edit') },
    { label: 'Đổi mật khẩu', icon: 'lock', action: () => router.navigate('/profile/password') },
  ];

  return <>
    <Pressable ref={anchor} onPress={showMenu} accessibilityRole="button" accessibilityLabel="Thêm" accessibilityHint="Mở các chức năng tài khoản" accessibilityState={{ expanded: open }} style={({ pressed }) => [styles.trigger, compact && styles.compactTrigger, open && styles.selected, pressed && styles.pressed]}>
      <Icon name="more" size={21} color={theme.colors.muted} />
      {!compact && <Text style={styles.triggerText}>Thêm</Text>}
    </Pressable>
    <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}>
        <Pressable onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Đóng menu Thêm" style={StyleSheet.absoluteFill} />
        <View style={[styles.panel, { left: position.left, top: position.top, width: position.width, maxHeight: Math.max(80, height - position.top - 12) }]}>
          <ScrollView contentContainerStyle={styles.menu}>
            <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>Tài khoản</Text><Pressable onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Đóng menu Thêm" style={styles.close}><Icon name="close" size={16} color={theme.colors.muted} /></Pressable></View>
            {items.map((item) => <Pressable key={item.label} onPress={() => select(item.action)} accessibilityRole="button" style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}><Icon name={item.icon} size={19} color={theme.colors.muted} /><Text style={styles.label}>{item.label}</Text><Icon name="chevron" size={14} color={theme.colors.subtle} /></Pressable>)}
            <View style={styles.separator} />
            <Pressable onPress={() => select(onLogout)} accessibilityRole="button" style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}><Icon name="logout" size={19} color={theme.colors.error} /><Text style={[styles.label, styles.danger]}>Đăng xuất</Text></Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  trigger: { minHeight: 38, paddingHorizontal: 12, backgroundColor: theme.colors.secondary, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  compactTrigger: { width: 38, paddingHorizontal: 0, borderRadius: 19 },
  selected: { backgroundColor: theme.colors.primarySoft },
  triggerText: { color: theme.colors.text, fontSize: 13, fontWeight: '500' },
  overlay: { flex: 1 },
  panel: { position: 'absolute', backgroundColor: theme.colors.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, boxShadow: '0 6px 22px rgba(0,0,0,0.12)', overflow: 'hidden' },
  menu: { padding: 8 },
  heading: { paddingLeft: 12, paddingRight: 4, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  close: { padding: 8 },
  item: { minHeight: 46, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 6 },
  itemPressed: { backgroundColor: theme.colors.secondary },
  label: { flex: 1, color: theme.colors.text, fontSize: 14 },
  separator: { height: 1, backgroundColor: theme.colors.border, marginVertical: 8, marginHorizontal: 12 },
  danger: { color: theme.colors.error },
  pressed: { opacity: 0.7 },
});
