import type { Message } from '../types/chat';

// thread là các tin của một cuộc trò chuyện theo thứ tự lưu/nhận của mock.
export function countUnreadMessages(thread: Message[], userId: string, lastReadMessageId: string | null): number {
  const readIndex = thread.findIndex((item) => item.id === lastReadMessageId);
  return thread.slice(readIndex + 1).filter((item) => item.senderId !== userId).length;
}
