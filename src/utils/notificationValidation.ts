import type { AppNotification } from '../types/notifications';

export function validNotifications(value: unknown): value is AppNotification[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => item && typeof item === 'object' &&
    typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.recipientId === 'string' && item.recipientId.length > 0 &&
    ['friend_request', 'friend_accepted', 'friend_connected', 'followed_post', 'system'].includes(item.type) &&
    (item.actorName === null || typeof item.actorName === 'string') &&
    typeof item.message === 'string' &&
    (item.sourceId === null || typeof item.sourceId === 'string') &&
    typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) &&
    (item.readAt === null || (typeof item.readAt === 'number' && Number.isFinite(item.readAt))) &&
    item.target && (item.target.screen === 'profile' ||
      (item.target.screen === 'friends' && ['friends', 'incoming'].includes(item.target.tab)) ||
      (item.target.screen === 'post' && typeof item.target.postId === 'string' && item.target.postId.trim().length > 0)) &&
    (item.type !== 'followed_post' || (item.target.screen === 'post' && item.sourceId === item.target.postId))) &&
    new Set(value.map((item) => item.id)).size === value.length;
}
