import { theme } from '../../core/theme';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import VideoContent from './VideoContent';

export type MediaItem = { name: string; uri: string | null; type?: 'image' | 'video' };
type Props = { items: MediaItem[]; index: number | null; onClose: () => void; onChange: (index: number) => void };

export default function MediaViewer({ items, index, onClose, onChange }: Props) {
  const current = index === null ? null : items[index];
  if (!current || index === null) return null;

  return <Modal visible transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.viewer}>
      <View style={styles.header}>
        <Text numberOfLines={1} style={styles.caption}>{current.name}</Text>
        <Pressable onPress={onClose} style={styles.button} accessibilityRole="button" accessibilityLabel="Đóng trình xem media"><Text style={styles.white}>Đóng ✕</Text></Pressable>
      </View>
      <View style={styles.content}>
        {!current.uri ? <Text style={styles.white}>Không đọc được nội dung này.</Text> : current.type === 'video' ? <VideoContent key={current.uri} uri={current.uri} name={current.name} /> : <Image source={{ uri: current.uri }} style={styles.image} resizeMode="contain" accessibilityLabel={current.name} />}
      </View>
      <View style={styles.footer}>
        <Pressable onPress={() => onChange(Math.max(0, index - 1))} disabled={index === 0} style={styles.button} accessibilityRole="button" accessibilityLabel="Nội dung trước"><Text style={[styles.white, index === 0 && styles.dim]}>← Trước</Text></Pressable>
        <Text style={styles.white}>{index + 1}/{items.length}</Text>
        <Pressable onPress={() => onChange(Math.min(items.length - 1, index + 1))} disabled={index === items.length - 1} style={styles.button} accessibilityRole="button" accessibilityLabel="Nội dung tiếp theo"><Text style={[styles.white, index === items.length - 1 && styles.dim]}>Sau →</Text></Pressable>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  viewer: { flex: 1, backgroundColor: theme.colors.text, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  caption: { flex: 1, color: theme.colors.onPrimary, fontSize: 16 },
  content: { flex: 1, minHeight: 0, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  button: { padding: 12 }, white: { color: theme.colors.onPrimary, fontWeight: 'bold' }, dim: { opacity: 0.4 },
});
