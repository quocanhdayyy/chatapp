import { loadImage, saveImages, type StoredImage } from '../storage/media';

export type PostImage = Pick<StoredImage, 'id' | 'name'>;

export const MAX_POST_IMAGES = 4;
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImageFiles(files: File[]) {
  if (files.length > MAX_POST_IMAGES) {
    throw new Error(`Mỗi bài chỉ được có tối đa ${MAX_POST_IMAGES} ảnh.`);
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type) || /\.gif$/i.test(file.name)) {
      throw new Error('Chỉ hỗ trợ ảnh JPG, PNG và WebP; không nhận GIF.');
    }
    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      throw new Error(`Ảnh "${file.name}" phải có dung lượng lớn hơn 0 và không quá 4MB.`);
    }
  }
}

function readAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Không đọc được ảnh đã chọn.'));
    };
    reader.onerror = () => reject(new Error('Không đọc được ảnh đã chọn.'));
    reader.onabort = () => reject(new Error('Việc đọc ảnh đã bị hủy.'));
    reader.readAsDataURL(file);
  });
}

// Upload giả: lưu ảnh tại trình duyệt, chỉ trả ID và tên cho dữ liệu bài viết.
export async function uploadImages(files: File[]): Promise<PostImage[]> {
  validateImageFiles(files);
  if (files.length === 0) return [];
  await new Promise((resolve) => setTimeout(resolve, 400));

  const images = await Promise.all(files.map(async (file) => ({
    id: crypto.randomUUID(),
    name: file.name,
    uri: await readAsDataUri(file),
  })));

  await saveImages(images);
  return images.map(({ id, name }) => ({ id, name }));
}

export async function getImage(id: string): Promise<StoredImage> {
  const image = await loadImage(id);
  if (!image || typeof image.uri !== 'string' || !image.uri.startsWith('data:image/')) {
    throw new Error('Ảnh không còn trong trình duyệt này.');
  }
  return image;
}
