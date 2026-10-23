import type { User } from './auth';
import { getImage, MAX_POST_IMAGES, type PostImage } from './media';
import { removeImages } from '../storage/media';
import { loadPosts, savePosts } from '../storage/posts';
import { loadProfile } from '../storage/profile';

export type Post = {
  id: string;
  authorId: string;
  author: string;
  content: string;
  likes: number;
  likedBy: string[];
  images: PostImage[];
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
    images: [],
  },
  {
    id: '2',
    authorId: '2',
    author: 'Mai',
    content: 'Xin chào mọi người!',
    likes: 12,
    likedBy: [],
    images: [],
  },
];

function readPosts(): Post[] {
  return loadPosts() ?? initialPosts.map((post) => ({ ...post }));
}

function withCurrentAuthor(post: Post): Post {
  const profile = loadProfile(post.authorId);
  return { ...post, likedBy: [...post.likedBy], images: post.images.map((image) => ({ ...image })), author: profile?.name ?? post.author };
}

export async function getPosts(): Promise<Post[]> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return readPosts().map(withCurrentAuthor);
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
    images: storedImages.map(({ id, name }) => ({ id, name })),
  };

  // Đọc danh sách mới nhất ngay trước khi lưu để không bỏ mất bài vừa được tạo.
  savePosts([post, ...readPosts()]);
  return { ...post };
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

  if (!text && currentPost.images.length === 0) {
    throw new Error('Vui lòng nhập nội dung hoặc giữ ảnh cho bài viết.');
  }

  if (text.length > MAX_POST_LENGTH) {
    throw new Error(`Bài viết không được vượt quá ${MAX_POST_LENGTH} ký tự.`);
  }

  const updatedPost = withCurrentAuthor({ ...currentPost, content: text });
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

export async function toggleLike(userId: string, postId: string): Promise<Post> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (!userId.trim()) {
    throw new Error('Vui lòng đăng nhập để thích bài viết.');
  }

  const posts = readPosts();
  const post = posts.find((item) => item.id === postId);

  if (!post) {
    throw new Error('Bài viết không còn tồn tại.');
  }

  const alreadyLiked = post.likedBy.includes(userId);
  const updatedPost = withCurrentAuthor({
    ...post,
    likes: Math.max(0, post.likes + (alreadyLiked ? -1 : 1)),
    likedBy: alreadyLiked
      ? post.likedBy.filter((id) => id !== userId)
      : [...post.likedBy, userId],
  });

  savePosts(posts.map((item) => item.id === postId ? updatedPost : item));
  return updatedPost;
}

export async function getPostById(postId: string): Promise<Post> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const post = readPosts().find((item) => item.id === postId);

  if (!post) {
    throw new Error('Bài viết không còn tồn tại.');
  }

  return withCurrentAuthor(post);
}
