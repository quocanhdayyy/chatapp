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
      (post.sharedPostId === undefined || (typeof post.sharedPostId === 'string' && post.sharedPostId.trim().length > 0 && post.sharedPostId !== post.id)) &&
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

    // Giữ dữ liệu cũ; bỏ các trường hiển thị được tính lại từ bài gốc.
    return posts.map((post) => ({
      id: post.id,
      authorId: post.authorId,
      author: post.author,
      content: post.content,
      likes: post.likes,
      likedBy: [...(post.likedBy ?? [])],
      images: (post.images ?? []).map((image: { id: string; name: string }) => ({ id: image.id, name: image.name })),
      ...(post.sharedPostId ? { sharedPostId: post.sharedPostId } : {}),
    }));
  } catch {
    return null;
  }
}

export function savePosts(posts: Post[]) {
  try {
    const stored = posts.map((post) => ({
      id: post.id,
      authorId: post.authorId,
      author: post.author,
      content: post.content,
      likes: post.likes,
      likedBy: post.likedBy,
      images: post.images.map(({ id, name }) => ({ id, name })),
      ...(post.sharedPostId ? { sharedPostId: post.sharedPostId } : {}),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    throw new Error('Không lưu được bài viết trên trình duyệt. Hãy thử lại.');
  }
}
