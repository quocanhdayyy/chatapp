import { ApiError } from '../core/network/ApiError';
import type { HttpRequest } from '../core/network/contracts';
import { saveSocialState } from '../storage/social';
import type { AppNotification } from '../types/notifications';
import { readMockSocialState } from './socialState';

export function handleNotificationsRequest(request: HttpRequest, userId: string): AppNotification[] {
  const state = readMockSocialState();
  const own = () => state.notifications.filter((item) => item.recipientId === userId)
    .sort((first, second) => second.createdAt - first.createdAt || first.id.localeCompare(second.id));

  if (request.method === 'GET' && request.path === '/notifications') return own();

  let changed = false;
  const now = Date.now();
  if (request.method === 'POST' && request.path === '/notifications/read-all') {
    state.notifications = state.notifications.map((item) => {
      if (item.recipientId !== userId || item.readAt !== null) return item;
      changed = true;
      return { ...item, readAt: now };
    });
  } else {
    const match = request.path.match(/^\/notifications\/([^/]+)\/read$/);
    if (request.method !== 'PATCH' || !match) throw new ApiError('Không tìm thấy yêu cầu thông báo.', 404, 'NOT_FOUND');
    const id = decodeURIComponent(match[1]);
    const notification = state.notifications.find((item) => item.id === id && item.recipientId === userId);
    if (!notification) throw new ApiError('Thông báo không tồn tại.', 404, 'NOTIFICATION_NOT_FOUND');
    if (notification.readAt === null) {
      changed = true;
      state.notifications = state.notifications.map((item) => item.id === id ? { ...item, readAt: now } : item);
    }
  }
  if (changed) saveSocialState(state);
  return own();
}
