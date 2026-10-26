import type { Message } from '../types/chat';

// Giữ tin vừa gửi khi một yêu cầu tải lịch sử cũ trả về muộn.
export function mergeChatMessages(
  current: Message[],
  incoming: Message[],
  conversationId: string,
): Message[] {
  const messages = new Map<string, Message>();

  for (const message of [...current, ...incoming]) {
    if (message.conversationId === conversationId) {
      messages.set(message.id, message);
    }
  }

  return [...messages.values()].sort((first, second) => first.createdAt - second.createdAt);
}
