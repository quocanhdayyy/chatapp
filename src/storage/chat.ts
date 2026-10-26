import { ApiError } from '../core/network/ApiError';
import type { Message } from '../types/chat';

export const CHAT_MESSAGES_STORAGE_KEY = 'chatapp-chat-messages';
const listeners = new Set<() => void>();

export function loadChatMessages(): Message[] | null {
  try {
    const saved = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);

    if (saved === null) return null;

    const messages: unknown = JSON.parse(saved);

    if (!Array.isArray(messages)) {
      throw new Error('Dữ liệu tin nhắn không hợp lệ.');
    }

    const valid = messages.every(
      (message) =>
        message !== null &&
        typeof message === 'object' &&
        typeof message.id === 'string' && message.id.trim().length > 0 &&
        typeof message.conversationId === 'string' && message.conversationId.trim().length > 0 &&
        typeof message.senderId === 'string' && message.senderId.trim().length > 0 &&
        typeof message.content === 'string' &&
        typeof message.createdAt === 'number' &&
        Number.isFinite(message.createdAt),
    );

    if (!valid || new Set(messages.map((message) => message.id)).size !== messages.length) {
      throw new Error('Dữ liệu tin nhắn không hợp lệ.');
    }

    return messages as Message[];
  } catch {
    throw new ApiError(
      'Không đọc được tin nhắn đã lưu trên trình duyệt.',
      500,
      'STORAGE_READ',
    );
  }
}

export function saveChatMessages(messages: Message[]): void {
  try {
    localStorage.setItem(
      CHAT_MESSAGES_STORAGE_KEY,
      JSON.stringify(messages),
    );
  } catch {
    throw new ApiError(
      'Không lưu được tin nhắn. Hãy thử lại.',
      500,
      'STORAGE_WRITE',
    );
  }

  listeners.forEach((listener) => {
    try { listener(); } catch { /* Không biến một lần lưu thành công thành lỗi giao diện. */ }
  });
}

export function subscribeChatMessages(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
