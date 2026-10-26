import type { FollowRelation } from '../types/friends';
import type { AppNotification } from '../types/notifications';

type PublishedPost = { id: string; authorId: string; author: string; sharedPostId?: string };

export function notificationsForPublishedPost(post: PublishedPost, follows: FollowRelation[]): AppNotification[] {
  const recipients = new Set(follows.filter((follow) => follow.toId === post.authorId && follow.fromId !== post.authorId).map((follow) => follow.fromId));
  const createdAt = Date.now();
  return [...recipients].map((recipientId) => ({
    id: `followed-post:${post.id}:${recipientId}`,
    recipientId,
    type: 'followed_post',
    actorName: post.author,
    message: `${post.author} ${post.sharedPostId ? 'vừa chia sẻ một bài viết.' : 'vừa đăng bài viết mới.'}`,
    sourceId: post.id,
    createdAt,
    readAt: null,
    target: { screen: 'post', postId: post.id },
  }));
}

export function mergePostNotifications(saved: AppNotification[], published: AppNotification[]): AppNotification[] {
  // Bản đã lưu giữ trạng thái đã đọc; bản ghi đăng bài chỉ bổ sung ID mới.
  const ids = new Set(saved.map((item) => item.id));
  return [...saved, ...published.filter((item) => !ids.has(item.id))];
}
