import { apiClient } from '../core/network/apiClient';
import type { AppNotification } from '../types/notifications';

export type { AppNotification, NotificationTarget } from '../types/notifications';

export function getNotifications(): Promise<AppNotification[]> {
  return apiClient.get('/notifications');
}

export function markNotificationRead(id: string): Promise<AppNotification[]> {
  return apiClient.patch(`/notifications/${encodeURIComponent(id)}/read`, {});
}

export function markAllNotificationsRead(): Promise<AppNotification[]> {
  return apiClient.post('/notifications/read-all', {});
}
