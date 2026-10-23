import type { Comment } from '../api/comments';

const STORAGE_KEY = 'chatapp-comments';

export function loadComments(): Comment[] | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return null;

    const comments: unknown = JSON.parse(saved);
    if (!Array.isArray(comments)) return null;

    const valid = comments.every((comment) =>
      comment !== null &&
      typeof comment === 'object' &&
      typeof comment.id === 'string' &&
      typeof comment.postId === 'string' &&
      typeof comment.authorId === 'string' &&
      typeof comment.author === 'string' &&
      typeof comment.content === 'string',
    );

    return valid ? comments : null;
  } catch {
    return null;
  }
}

export function saveComments(comments: Comment[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  } catch {
    throw new Error('Không lưu được bình luận trên trình duyệt. Hãy thử lại.');
  }
}
