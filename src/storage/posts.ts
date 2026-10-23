import type { Post } from '../api/posts';

const STORAGE_KEY = 'chatapp-posts';

export function loadPosts(): Post[] | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return null;

    const posts: unknown = JSON.parse(saved);

    if (!Array.isArray(posts)) return null;

    const valid = posts.every((post) =>
      post !== null &&
      typeof post === 'object' &&
      typeof post.id === 'string' &&
      typeof post.authorId === 'string' &&
      typeof post.author === 'string' &&
      typeof post.content === 'string' &&
      typeof post.likes === 'number' &&
      Number.isFinite(post.likes) &&
      post.likes >= 0 &&
      (post.likedBy === undefined || (
        Array.isArray(post.likedBy) &&
        post.likedBy.every((id: unknown) => typeof id === 'string') &&
        new Set(post.likedBy).size === post.likedBy.length &&
        post.likes >= post.likedBy.length
      )) &&
      (post.images === undefined || (
        Array.isArray(post.images) &&
        post.images.length <= 4 &&
        post.images.every((image: unknown) => {
          if (image === null || typeof image !== 'object') return false;
          const item = image as { id?: unknown; name?: unknown };
          return typeof item.id === 'string' && typeof item.name === 'string';
        })
      )),
    );

    if (!valid) return null;

    // Bài đã lưu trước khi có chức năng Like vẫn được giữ nguyên.
    return posts.map((post) => ({
      ...post,
      likedBy: [...(post.likedBy ?? [])],
      images: (post.images ?? []).map((image: { id: string; name: string }) => ({ ...image })),
    }));
  } catch {
    return null;
  }
}

export function savePosts(posts: Post[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch {
    throw new Error('Không lưu được bài viết trên trình duyệt. Hãy thử lại.');
  }
}
