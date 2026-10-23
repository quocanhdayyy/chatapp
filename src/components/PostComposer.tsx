import { theme } from '../core/theme';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState, type Ref, type ComponentRef } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { User } from '../api/auth';
import { MAX_POST_IMAGES, uploadImages, validateImageFiles, type PostImage } from '../api/media';
import { createPost, MAX_POST_LENGTH, type Post } from '../api/posts';
import { removeImages } from '../storage/media';
import UserAvatar from './ui/UserAvatar';
import Icon from './ui/Icon';

type SelectedImage = { id: string; file: File; uri: string };
type PostComposerProps = { user: User; onPublished: (post: Post) => void; disabled?: boolean; autoFocus?: boolean; inputRef?: Ref<ComponentRef<typeof TextInput>> };

export default function PostComposer({ user, onPublished, disabled = false, autoFocus = false, inputRef }: PostComposerProps) {
  const [content, setContent] = useState('');
  const [selected, setSelected] = useState<SelectedImage[]>([]);
  const selectedRef = useRef<SelectedImage[]>([]);
  const mounted = useRef(true);
  const [picking, setPicking] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      selectedRef.current.forEach((image) => URL.revokeObjectURL(image.uri));
    };
  }, []);

  function replaceSelected(images: SelectedImage[]) {
    selectedRef.current = images;
    setSelected(images);
  }

  async function handlePickImages() {
    if (picking || publishing || disabled) return;
    setError('');
    setNotice('');
    setPicking(true);

    let pickedAssets: ImagePicker.ImagePickerAsset[] = [];
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
      });
      if (result.canceled) return;
      pickedAssets = result.assets;

      if (!mounted.current) {
        pickedAssets.forEach((asset) => URL.revokeObjectURL(asset.uri));
        return;
      }

      const additions = pickedAssets.map((asset) => {
        if (!asset.file || asset.width <= 0 || asset.height <= 0) {
          throw new Error('Không đọc được ảnh. Hãy chọn ảnh JPG, PNG hoặc WebP khác.');
        }
        return { id: crypto.randomUUID(), file: asset.file, uri: asset.uri };
      });

      const combined = [...selectedRef.current, ...additions];
      validateImageFiles(combined.map((image) => image.file));
      replaceSelected(combined);
    } catch (err) {
      pickedAssets.forEach((asset) => URL.revokeObjectURL(asset.uri));
      if (mounted.current) setError(err instanceof Error ? err.message : 'Không chọn được ảnh.');
    } finally {
      if (mounted.current) setPicking(false);
    }
  }

  function handleRemoveImage(id: string) {
    const image = selectedRef.current.find((item) => item.id === id);
    if (image) URL.revokeObjectURL(image.uri);
    replaceSelected(selectedRef.current.filter((item) => item.id !== id));
    setError('');
  }

  async function handlePublish() {
    if (publishing || picking || disabled) return;
    setError('');
    setNotice('');

    if (!content.trim() && selected.length === 0) {
      setError('Vui lòng nhập nội dung hoặc chọn ảnh cho bài viết.');
      return;
    }

    setPublishing(true);
    let uploaded: PostImage[] = [];
    try {
      uploaded = await uploadImages(selected.map((image) => image.file));
      const post = await createPost(user, content, uploaded);
      onPublished(post);
      selectedRef.current.forEach((image) => URL.revokeObjectURL(image.uri));
      replaceSelected([]);
      setContent('');
      setNotice('Đã đăng bài viết.');
    } catch (err) {
      await removeImages(uploaded.map((image) => image.id)).catch(() => undefined);
      if (mounted.current) setError(err instanceof Error ? err.message : 'Không đăng được bài viết.');
    } finally {
      if (mounted.current) setPublishing(false);
    }
  }

  const busy = publishing || picking || disabled;
  const cannotPublish = busy || (!content.trim() && selected.length === 0);

  return (
    <View style={styles.card}>
      <View style={styles.composeRow}>
        <UserAvatar userId={user.id} name={user.name} size={44} />
        <TextInput
        ref={inputRef}
        autoFocus={autoFocus}
        style={styles.input}
        placeholderTextColor={theme.colors.subtle}
        placeholder="Bạn muốn chia sẻ điều gì?"
        value={content}
        onChangeText={(value) => { setContent(value); setError(''); setNotice(''); }}
        multiline
        maxLength={MAX_POST_LENGTH}
        editable={!busy}
        accessibilityLabel="Nội dung bài viết"
        />
      </View>

      <View style={styles.previewGrid}>
        {selected.map((image, index) => (
          <View key={image.id} style={styles.preview}>
            <Image source={{ uri: image.uri }} style={styles.previewImage} resizeMode="cover" accessibilityLabel={`Ảnh đã chọn ${index + 1}`} />
            <Pressable style={styles.remove} onPress={() => handleRemoveImage(image.id)} disabled={busy} accessibilityRole="button" accessibilityLabel={`Gỡ ảnh ${index + 1}`}>
              <Text style={styles.removeText}>Gỡ ảnh</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable onPress={handlePickImages} disabled={busy || selected.length >= MAX_POST_IMAGES} style={styles.photoButton} accessibilityRole="button">
          <Icon name="image" size={18} color={theme.colors.sageInk} /><Text style={styles.photoText}>{picking ? 'Đang chọn…' : selected.length ? `Thêm ảnh (${selected.length}/${MAX_POST_IMAGES})` : 'Thêm ảnh'}</Text>
        </Pressable>
        <Pressable style={[styles.button, cannotPublish && styles.disabled]} onPress={handlePublish} disabled={cannotPublish} accessibilityRole="button">
          <Text style={styles.buttonText}>{publishing ? 'Đang đăng…' : 'Đăng bài'}</Text>
        </Pressable>
      </View>

      {(content.length > 0 || selected.length > 0) && <Text style={styles.counter}>{content.length}/{MAX_POST_LENGTH} ký tự · Tối đa {MAX_POST_IMAGES} ảnh, 4MB/ảnh</Text>}
      {error !== '' && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
      {notice !== '' && <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', backgroundColor: theme.colors.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 16 },
  composeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 20 },
  input: { flex: 1, minWidth: 0, minHeight: 84, padding: 8, fontSize: 16, lineHeight: 25, textAlignVertical: 'top', color: theme.colors.text, borderWidth: 0, borderRadius: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingHorizontal: 16, paddingVertical: 12 },
  counter: { color: theme.colors.muted, fontSize: 11, paddingHorizontal: 20, paddingBottom: 12, lineHeight: 18 },
  button: { backgroundColor: theme.colors.primary, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', minHeight: 40 },
  buttonText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: 13 },
  photoButton: { paddingVertical: 10, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40 },
  photoText: { color: theme.colors.text, fontWeight: '500', fontSize: 13 },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  preview: { width: 100, gap: 4, marginBottom: 15 },
  previewImage: { width: 100, height: 85, borderRadius: 6 },
  remove: { paddingVertical: 4 },
  removeText: { color: theme.colors.error, fontSize: 11 },
  disabled: { opacity: 0.45 },
  error: { color: theme.colors.error, marginHorizontal: 20, marginBottom: 16, fontSize: 13, lineHeight: 20 },
  notice: { color: theme.colors.success, marginHorizontal: 20, marginBottom: 16, fontSize: 13 },
});
