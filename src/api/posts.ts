import type { User } from './auth';
import { getImage, MAX_POST_IMAGES, type PostImage } from './media';
import { removeImages } from '../storage/media';
import { loadPosts, savePosts } from '../storage/posts';
import { loadProfile } from '../storage/profile';

export type ReactionType = 'like' | 'heart';

export type SharedPost = {
  id: string;
  authorId: string;
  author: string;
  content: string;
  images: PostImage[];
};

export type Post = {
  id: string;
  authorId: string;
  author: string;
  content: string;
  likes: number;
  likedBy: string[];
  reactions?: Record<string, ReactionType>;
  images: PostImage[];
  sharedPostId?: string;
  // Hai trường này được tính từ danh sách hiện tại, không lưu bản sao bài gốc.
  sharedPost?: SharedPost | null;
  shareCount?: number;
};

export const MAX_POST_LENGTH = 2000;

const initialPosts: Post[] = [
  {
    id: '1',
    authorId: '1',
    author: 'Quốc Anh',
    content: 'Hôm nay bắt đầu xây dựng ChatApp!',
    likes: 5,
    likedBy: [],
    reactions: {},
    images: [],
  },
  {
    id: '2',
    authorId: '2',
    author: 'Mai',
    content: 'Xin chào mọi người!',
    likes: 12,
    likedBy: [],
    reactions: {},
    images: [],
  },
];

function readPosts(): Post[] {
  return loadPosts() ?? initialPosts.map((post) => ({ ...post }));
}

function withCurrentAuthor(post: Post, posts: Post[]): Post {
  const originalId = post.sharedPostId ?? post.id;
  const original = post.sharedPostId ? posts.find((item) => item.id === originalId && !item.sharedPostId) : undefined;
  return {
    ...post,
    author: loadProfile(post.authorId)?.name ?? post.author,
    likedBy: [...post.likedBy],
    reactions: { ...(post.reactions ?? Object.fromEntries(post.likedBy.map((id) => [id, 'like' as const]))) },
    images: post.images.map((image) => ({ ...image })),
    shareCount: posts.filter((item) => item.sharedPostId === originalId).length,
    sharedPost: post.sharedPostId ? (original ? {
      id: original.id,
      authorId: original.authorId,
      author: loadProfile(original.authorId)?.name ?? original.author,
      content: original.content,
      images: original.images.map((image) => ({ ...image })),
    } : null) : undefined,
  };
}

export async function getPosts(): Promise<Post[]> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const posts = readPosts();
  return posts.map((post) => withCurrentAuthor(post, posts));
}

export async function createPost(user: User, content: string, images: PostImage[] = []): Promise<Post> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const text = content.trim();

  if (!text && images.length === 0) {
    throw new Error('Vui lòng nhập nội dung hoặc chọn ảnh cho bài viết.');
  }

  if (images.length > MAX_POST_IMAGES || new Set(images.map((image) => image.id)).size !== images.length) {
    throw new Error('Mỗi bài chỉ được có tối đa 4 ảnh khác nhau.');
  }

  const storedImages = await Promise.all(images.map((image) => getImage(image.id)));

  if (text.length > MAX_POST_LENGTH) {
    throw new Error(`Bài viết không được vượt quá ${MAX_POST_LENGTH} ký tự.`);
  }

  const profile = loadProfile(user.id);
  const post: Post = {
    id: crypto.randomUUID(),
    authorId: user.id,
    author: profile?.name ?? user.name,
    content: text,
    likes: 0,
    likedBy: [],
    reactions: {},
    images: storedImages.map(({ id, name }) => ({ id, name })),
  };

  // Đọc danh sách mới nhất ngay trước khi lưu để không bỏ mất bài vừa được tạo.
  const posts = [post, ...readPosts()];
  savePosts(posts);
  return withCurrentAuthor(post, posts);
}

function findOwnPost(posts: Post[], userId: string, postId: string): Post {
  const post = posts.find((item) => item.id === postId);

  if (!post) {
    throw new Error('Bài viết không còn tồn tại.');
  }

  if (post.authorId !== userId) {
    throw new Error('Bạn chỉ được sửa hoặc xóa bài viết của mình.');
  }

  return post;
}

export async function updatePost(
  userId: string,
  postId: string,
  content: string,
): Promise<Post> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const posts = readPosts();
  const currentPost = findOwnPost(posts, userId, postId);
  const text = content.trim();

  if (!text && currentPost.images.length === 0 && !currentPost.sharedPostId) {
    throw new Error('Vui lòng nhập nội dung hoặc giữ ảnh cho bài viết.');
  }

  if (text.length > MAX_POST_LENGTH) {
    throw new Error(`Bài viết không được vượt quá ${MAX_POST_LENGTH} ký tự.`);
  }

  const updatedPost = withCurrentAuthor({ ...currentPost, content: text }, posts);
  savePosts(posts.map((post) => post.id === postId ? updatedPost : post));
  return { ...updatedPost };
}

export async function deletePost(userId: string, postId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const posts = readPosts();
  const removedPost = findOwnPost(posts, userId, postId);
  const remainingPosts = posts.filter((post) => post.id !== postId);
  savePosts(remainingPosts);

  const referenced = new Set(remainingPosts.flatMap((post) => post.images.map((image) => image.id)));
  const unusedImageIds = removedPost.images.filter((image) => !referenced.has(image.id)).map((image) => image.id);
  // Bài đã được xóa; lỗi dọn ảnh không được khiến giao diện giữ lại bài đó.
  await removeImages(unusedImageIds).catch(() => undefined);
}

export function getReactionCounts(post: Post): { like: number; heart: number } {
  const heart = Object.values(post.reactions ?? {}).filter((value) => value === 'heart').length;
  // Các lượt thích mẫu/cũ chưa có ID vẫn được tính là Thích.
  return { like: Math.max(0, post.likes - heart), heart };
}

export async function toggleReaction(userId: string, postId: string, reaction: ReactionType): Promise<Post> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (!userId.trim()) throw new Error('Vui lòng đăng nhập để bày tỏ cảm xúc.');
  if (reaction !== 'like' && reaction !== 'heart') throw new Error('Chỉ hỗ trợ Thích hoặc Tim.');

  const posts = readPosts();
  const post = posts.find((item) => item.id === postId);
  if (!post) throw new Error('Bài viết không còn tồn tại.');

  const reactions: Record<string, ReactionType> = {
    ...(post.reactions ?? Object.fromEntries(post.likedBy.map((id) => [id, 'like' as const]))),
  };
  const previous = Object.hasOwn(reactions, userId) ? reactions[userId] : undefined;
  const removing = previous === reaction;
  if (removing) delete reactions[userId];
  else reactions[userId] = reaction;

  const updatedPost = withCurrentAuthor({
    ...post,
    likes: Math.max(0, post.likes + (removing ? -1 : previous ? 0 : 1)),
    likedBy: Object.keys(reactions),
    reactions,
  }, posts);
  savePosts(posts.map((item) => item.id === postId ? updatedPost : item));
  return updatedPost;
}

// Giữ hàm cũ để các chỗ đang gọi Like tiếp tục hoạt động.
export async function toggleLike(userId: string, postId: string): Promise<Post> {
  return toggleReaction(userId, postId, 'like');
}

export async function getPostById(postId: string): Promise<Post> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const posts = readPosts();
  const post = posts.find((item) => item.id === postId);

  if (!post) {
    throw new Error('Bài viết không còn tồn tại.');
  }

  return withCurrentAuthor(post, posts);
}

// Chia sẻ tạo một bài mới của người chia sẻ và chỉ tham chiếu ID bài gốc.
export async function sharePost(user: User, postId: string, content = ''): Promise<Post> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (!user || typeof user.id !== 'string' || !user.id.trim()) {
    throw new Error('Vui lòng đăng nhập để chia sẻ bài viết.');
  }
  const text = content.trim();
  if (text.length > MAX_POST_LENGTH) {
    throw new Error(`Lời nhắn không được vượt quá ${MAX_POST_LENGTH} ký tự.`);
  }

  const posts = readPosts();
  const selected = posts.find((post) => post.id === postId);
  if (!selected) throw new Error('Bài viết không còn tồn tại.');

  // Chia sẻ lại một bài đã chia sẻ vẫn trỏ thẳng đến bài gốc, tránh lồng nhiều tầng.
  const originalId = selected.sharedPostId ?? selected.id;
  const original = posts.find((post) => post.id === originalId && !post.sharedPostId);
  if (!original) throw new Error('Bài viết gốc không còn tồn tại, không thể chia sẻ.');

  const shared: Post = {
    id: crypto.randomUUID(),
    authorId: user.id,
    author: loadProfile(user.id)?.name ?? user.name,
    content: text,
    likes: 0,
    likedBy: [],
    reactions: {},
    images: [],
    sharedPostId: original.id,
  };
  const updated = [shared, ...posts];
  savePosts(updated);
  return withCurrentAuthor(shared, updated);
}
