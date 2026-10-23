import { theme } from '../core/theme';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { getImage, type PostImage } from '../api/media';
import MediaViewer from './shared/MediaViewer';

type DisplayImage = { id: string; name: string; uri: string | null };

export default function PostImages({ images, gallery = false }: { images: PostImage[]; gallery?: boolean }) {
  const [items, setItems] = useState<DisplayImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [reload, setReload] = useState(0);
  const imageKey = JSON.stringify(images.map((image) => image.id));

  useEffect(() => {
    let active = true;
    const ids: string[] = JSON.parse(imageKey);

    async function load() {
      setLoading(true);
      const results = await Promise.all(ids.map(async (id): Promise<DisplayImage> => {
        try {
          return await getImage(id);
        } catch {
          return { id, name: 'Không đọc được ảnh đã lưu', uri: null };
        }
      }));
      if (active) { setItems(results); setSelected(null); setLoading(false); }
    }

    load();
    return () => { active = false; };
  }, [imageKey, reload]);

  if (images.length === 0) return null;

  return (
    <View style={[styles.section, gallery && styles.gallerySection]}>
      {loading ? <ActivityIndicator color={theme.colors.primary} accessibilityLabel="Đang tải ảnh" /> : (
        <View style={styles.grid}>
          {items.map((image, index) => (
            <Pressable
              key={image.id}
              onPress={() => setSelected(index)}
              disabled={!image.uri}
              accessibilityRole="button"
              accessibilityLabel={`Xem ảnh ${index + 1}: ${image.name}`}
              style={[styles.tile, gallery ? styles.galleryTile : items.length === 1 && styles.singleTile]}
            >
              {image.uri ? (
                <Image source={{ uri: image.uri }} style={styles.thumbnail} resizeMode="cover" accessibilityLabel={image.name} />
              ) : <Text style={styles.muted}>Không đọc được ảnh. Hãy thử tải lại.</Text>}
            </Pressable>
          ))}
        </View>
      )}

      {!loading && items.some((image) => !image.uri) && (
        <Pressable onPress={() => setReload((value) => value + 1)} accessibilityRole="button">
          <Text style={styles.retry}>Thử tải lại ảnh</Text>
        </Pressable>
      )}

      <MediaViewer items={items} index={selected} onClose={() => setSelected(null)} onChange={setSelected} />

    </View>
  );
}

const styles = StyleSheet.create({
  gallerySection: { marginTop: 0 },
  galleryTile: { width: '31%', aspectRatio: 1, borderRadius: 6 },
  section: { marginTop: 19 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '48%', aspectRatio: 1.2, borderRadius: 13, overflow: 'hidden', backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  singleTile: { width: '100%', aspectRatio: 1.5 },
  thumbnail: { width: '100%', height: '100%' },
  muted: { color: theme.colors.muted, padding: 12, lineHeight: 20, fontSize: 12 },
  retry: { color: theme.colors.primary, marginTop: 12, fontSize: 12 },
});
