import { ApiError } from '../core/network/ApiError';
import type { FriendRelation } from '../types/friends';
import type { AppNotification } from '../types/notifications';

// Giữ khóa cũ để đọc tiếp dữ liệu bạn bè đã lưu trước khi có thông báo.
export const SOCIAL_STORAGE_KEY = 'chatapp-friend-relations';
export type SocialState = { version: 2; relations: FriendRelation[]; notifications: AppNotification[] };
type SocialSnapshot = { relations: FriendRelation[]; notifications: AppNotification[] | null };
const listeners = new Set<() => void>();

function validRelations(value: unknown): value is FriendRelation[] {
  if (!Array.isArray(value)) return false;
  const valid = value.every((item) => item && typeof item === 'object' &&
    typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.fromId === 'string' && item.fromId.length > 0 &&
    typeof item.toId === 'string' && item.toId.length > 0 && item.fromId !== item.toId &&
    (item.status === 'pending' || item.status === 'accepted'));
  if (!valid) return false;
  const ids = new Set(value.map((item) => item.id));
  const pairs = new Set(value.map((item) => JSON.stringify([item.fromId, item.toId].sort())));
  return ids.size === value.length && pairs.size === value.length;
}

function validNotifications(value: unknown): value is AppNotification[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => item && typeof item === 'object' &&
    typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.recipientId === 'string' && item.recipientId.length > 0 &&
    ['friend_request', 'friend_accepted', 'friend_connected', 'system'].includes(item.type) &&
    (item.actorName === null || typeof item.actorName === 'string') &&
    typeof item.message === 'string' &&
    (item.sourceId === null || typeof item.sourceId === 'string') &&
    typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) &&
    (item.readAt === null || (typeof item.readAt === 'number' && Number.isFinite(item.readAt))) &&
    item.target && (item.target.screen === 'profile' ||
      (item.target.screen === 'friends' && ['friends', 'incoming'].includes(item.target.tab)))) &&
    new Set(value.map((item) => item.id)).size === value.length;
}

export function loadSocialState(): SocialSnapshot | null {
  try {
    const saved = localStorage.getItem(SOCIAL_STORAGE_KEY);
    if (saved === null) return null;
    const data: unknown = JSON.parse(saved);
    // Phiên bản trước chỉ lưu mảng quan hệ; chưa ghi lại cho đến khi có thay đổi.
    if (validRelations(data)) return { relations: data, notifications: null };
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const state = data as Partial<SocialState>;
      if (state.version === 2 && validRelations(state.relations) && validNotifications(state.notifications)) {
        return { relations: state.relations, notifications: state.notifications };
      }
    }
    throw new Error('Invalid social data');
  } catch {
    throw new ApiError('Không đọc được dữ liệu bạn bè/thông báo trên trình duyệt. Hãy thử tải lại trang.', 500, 'STORAGE_READ');
  }
}

export function saveSocialState(state: SocialState): void {
  try {
    // Một lần ghi để quan hệ và thông báo cùng thành công hoặc cùng thất bại.
    localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    throw new ApiError('Không lưu được thay đổi. Hãy kiểm tra bộ nhớ trình duyệt và thử lại.', 500, 'STORAGE_WRITE');
  }
  listeners.forEach((listener) => {
    try { listener(); } catch { /* Lỗi bên nghe không làm sai kết quả đã lưu. */ }
  });
}

export function subscribeSocialState(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
