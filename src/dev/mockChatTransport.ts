import type { ChatMessageTransport } from '../core/chatTransport';
import { CHAT_MESSAGES_STORAGE_KEY, loadChatMessages, subscribeChatMessages } from '../storage/chat';
import { initialConversations, initialMessages } from './chatData';

export const mockChatTransport: ChatMessageTransport = {
  subscribe(userId, onMessage, onError) {
    let closed = false;
    const seenIds = new Set(initialMessages.map((message) => message.id));

    function sync(emit = true) {
      if (closed) return;

      try {
        const messages = loadChatMessages() ?? initialMessages;
        const fresh = messages.filter((message) => !seenIds.has(message.id));

        // Đánh dấu trước khi gọi listener để không phát trùng khi có cập nhật lồng nhau.
        for (const message of messages) seenIds.add(message.id);
        if (!emit) return;

        for (const message of fresh) {
          const conversation = initialConversations.find((item) => item.id === message.conversationId);
          if (!conversation?.participantIds.includes(userId) ||
              !conversation.participantIds.includes(message.senderId)) continue;

          try { onMessage({ ...message }); } catch { /* Listener lỗi không làm hỏng tin đã lưu. */ }
        }
      } catch (error) {
        try { onError?.(error instanceof Error ? error : new Error('Không đồng bộ được tin nhắn.')); } catch { /* Tách lỗi giao diện khỏi storage. */ }
      }
    }

    // Tin đã có sẽ được đọc bằng REST API; chỉ phát sự kiện cho tin mới.
    sync(false);
    const unsubscribe = subscribeChatMessages(() => sync());

    const onStorage = (event: StorageEvent) => {
      if (event.storageArea && event.storageArea !== localStorage) return;
      if (event.key === CHAT_MESSAGES_STORAGE_KEY || event.key === null) sync();
    };
    const onFocus = () => sync();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') sync();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
      window.addEventListener('focus', onFocus);
    }
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);

    return () => {
      closed = true;
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('focus', onFocus);
      }
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
    };
  },
};
