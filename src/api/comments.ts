import type { User } from './auth';
import { getPostById } from './posts';
import { loadComments, saveComments } from '../storage/comments';
import { loadProfile } from '../storage/profile';

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  author: string;
  content: string;
};

export const MAX_COMMENT_LENGTH = 1000;

const initialComments: Comment[] = [
  {
    id: 'comment-1',
    postId: '1',
    authorId: '2',
    author: 'Mai',
    content: 'Cùng xây dựng ChatApp nhé!',
  },
];

function readComments(): Comment[] {
  return loadComments() ?? initialComments.map((comment) => ({ ...comment }));
}

function withCurrentAuthor(comment: Comment): Comment {
  const profile = loadProfile(comment.authorId);
  return { ...comment, author: profile?.name ?? comment.author };
}

export async function getComments(postId: string): Promise<Comment[]> {
  await getPostById(postId);
  return readComments()
    .filter((comment) => comment.postId === postId)
    .map(withCurrentAuthor);
}

export async function createComment(
  user: User,
  postId: string,
  content: string,
): Promise<Comment> {
  // Kiểm tra bài còn tồn tại trước khi ghi bình luận vào dữ liệu giả.
  await getPostById(postId);

  const text = content.trim();

  if (!text) {
    throw new Error('Vui lòng nhập nội dung bình luận.');
  }

  if (text.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Bình luận không được vượt quá ${MAX_COMMENT_LENGTH} ký tự.`);
  }

  const comment = withCurrentAuthor({
    id: crypto.randomUUID(),
    postId,
    authorId: user.id,
    author: user.name,
    content: text,
  });

  saveComments([...readComments(), comment]);
  return { ...comment };
}

export async function deleteComment(
  userId: string,
  postId: string,
  commentId: string,
): Promise<void> {
  await getPostById(postId);

  const comments = readComments();
  const comment = comments.find((item) => item.id === commentId && item.postId === postId);

  if (!comment) {
    throw new Error('Bình luận không còn tồn tại.');
  }

  if (comment.authorId !== userId) {
    throw new Error('Bạn chỉ được xóa bình luận của mình.');
  }

  saveComments(comments.filter((item) => item.id !== commentId));
}
