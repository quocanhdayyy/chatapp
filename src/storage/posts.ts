import type { Post, ReactionType } from '../api/posts';
import type { AppNotification } from '../types/notifications';
import { validNotifications } from '../utils/notificationValidation';

export const POSTS_STORAGE_KEY = 'chatapp-posts';
type PostState = { version: 2; posts: Post[]; notifications: AppNotification[] };
const listeners = new Set<() => void>();

function validPosts(value: unknown): value is Post[] {
  if (!Array.isArray(value)) return false;
  return value.every((post) => post !== null && typeof post === 'object' &&
    typeof post.id === 'string' && typeof post.authorId === 'string' &&
    typeof post.author === 'string' && typeof post.content === 'string' &&
    (post.sharedPostId === undefined || (typeof post.sharedPostId === 'string' && post.sharedPostId.trim().length > 0 && post.sharedPostId !== post.id)) &&
    typeof post.likes === 'number' && Number.isFinite(post.likes) && post.likes >= 0 &&
    (post.likedBy === undefined || (Array.isArray(post.likedBy) &&
      post.likedBy.every((id: unknown) => typeof id === 'string') &&
      new Set(post.likedBy).size === post.likedBy.length && post.likes >= post.likedBy.length)) &&
    (post.reactions === undefined || (post.reactions !== null && typeof post.reactions === 'object' && !Array.isArray(post.reactions) &&
      Object.keys(post.reactions).every((id) => id.trim().length > 0) &&
      Object.values(post.reactions).every((reaction) => reaction === 'like' || reaction === 'heart') &&
      post.likes >= Object.keys(post.reactions).length)) &&
    (post.images === undefined || (Array.isArray(post.images) && post.images.length <= 4 &&
      post.images.every((image: unknown) => image !== null && typeof image === 'object' &&
        typeof (image as { id?: unknown }).id === 'string' && typeof (image as { name?: unknown }).name === 'string')))) &&
    new Set(value.map((post) => post.id)).size === value.length;
}

function normalizedPosts(posts: Post[]): Post[] {
  return posts.map((post) => {
    const reactions: Record<string, ReactionType> = post.reactions
      ? { ...post.reactions } : Object.fromEntries((post.likedBy ?? []).map((id) => [id, 'like']));
    return {
      id: post.id, authorId: post.authorId, author: post.author, content: post.content,
      likes: post.likes, likedBy: Object.keys(reactions), reactions,
      images: (post.images ?? []).map(({ id, name }) => ({ id, name })),
      ...(post.sharedPostId ? { sharedPostId: post.sharedPostId } : {}),
    };
  });
}

function readPostState(): PostState | null {
  try {
    const saved = localStorage.getItem(POSTS_STORAGE_KEY);
    if (saved === null) return null;
    const value: unknown = JSON.parse(saved);
    // Mảng bài viết của bản cũ không sinh thông báo hồi tố.
    if (validPosts(value)) return { version: 2, posts: normalizedPosts(value), notifications: [] };
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const state = value as Partial<PostState>;
      if (state.version === 2 && validPosts(state.posts) && validNotifications(state.notifications)) {
        return { version: 2, posts: normalizedPosts(state.posts), notifications: state.notifications };
      }
    }
    throw new Error('Invalid posts data');
  } catch {
    throw new Error('Không đọc được bài viết/thông báo trên trình duyệt. Hãy thử tải lại trang.');
  }
}

export function loadPosts(): Post[] | null {
  return readPostState()?.posts ?? null;
}

export function loadPostNotifications(): AppNotification[] {
  return readPostState()?.notifications ?? [];
}

export function savePosts(posts: Post[], newNotifications: AppNotification[] = []): void {
  const existing = readPostState()?.notifications ?? [];
  const ids = new Set(existing.map((item) => item.id));
  const added = newNotifications.filter((item) => {
    if (ids.has(item.id)) return false;
    ids.add(item.id);
    return true;
  });
  const state: PostState = { version: 2, posts: normalizedPosts(posts), notifications: [...existing, ...added] };
  try {
    // Bài và danh sách người nhận thông báo cùng nằm trong một lần ghi.
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    throw new Error('Không lưu được bài viết trên trình duyệt. Hãy thử lại.');
  }
  if (added.length > 0) listeners.forEach((listener) => {
    try { listener(); } catch { /* Lỗi hiển thị không làm sai kết quả đã lưu. */ }
  });
}

export function subscribePostNotifications(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
