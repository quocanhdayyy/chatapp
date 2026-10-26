import { ApiError } from '../core/network/ApiError';
import type { ChatReadCursor } from '../types/chat';

export const CHAT_READ_STORAGE_KEY = 'chatapp-chat-read-cursors';
const listeners = new Set<() => void>();

export function loadChatReadCursors(): ChatReadCursor[] {
  try {
    const saved = localStorage.getItem(CHAT_READ_STORAGE_KEY);
    if (saved === null) return [];
    const items: unknown = JSON.parse(saved);
    if (!Array.isArray(items)) throw new Error('Invalid cursors');
    const pairs = new Set<string>();
    for (const item of items) {
      if (!item || typeof item !== 'object' ||
          ![item.userId, item.conversationId, item.messageId].every((value) => typeof value === 'string' && value.trim())) {
        throw new Error('Invalid cursor');
      }
      const pair = JSON.stringify([item.userId, item.conversationId]);
      if (pairs.has(pair)) throw new Error('Duplicate cursor');
      pairs.add(pair);
    }
    return items as ChatReadCursor[];
  } catch {
    throw new ApiError('Không đọc được mốc đã đọc trên trình duyệt.', 500, 'STORAGE_READ');
  }
}

export function saveChatReadCursors(cursors: ChatReadCursor[]): void {
  try {
    localStorage.setItem(CHAT_READ_STORAGE_KEY, JSON.stringify(cursors));
  } catch {
    throw new ApiError('Không lưu được mốc đã đọc. Hãy thử lại.', 500, 'STORAGE_WRITE');
  }
  listeners.forEach((listener) => {
    try { listener(); } catch { /* Mốc đọc đã lưu thành công. */ }
  });
}

export function subscribeChatReadCursors(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
