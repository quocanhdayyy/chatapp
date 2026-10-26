import { createContext, useContext, useEffect, useState, useSyncExternalStore, type PropsWithChildren } from 'react';
import { createChatInbox } from '../core/chatInbox';
import { CHAT_MESSAGES_STORAGE_KEY, subscribeChatMessages } from '../storage/chat';
import { CHAT_READ_STORAGE_KEY, subscribeChatReadCursors } from '../storage/chatRead';
import type { ConversationSummary } from '../types/chat';

type ChatInboxValue = {
  summaries: ConversationSummary[];
  loading: boolean;
  error: string;
  unreadCount: number | null;
  refresh: () => Promise<void>;
  markRead: (conversationId: string, messageId: string) => Promise<void>;
};
const ChatInboxContext = createContext<ChatInboxValue | null>(null);

export function ChatInboxProvider({ children }: PropsWithChildren) {
  const [inbox] = useState(() => createChatInbox());
  const snapshot = useSyncExternalStore(inbox.subscribe, inbox.getSnapshot, inbox.getSnapshot);

  useEffect(() => {
    const reload = () => { void inbox.refresh(); };
    const stopMessages = subscribeChatMessages(reload);
    const stopReads = subscribeChatReadCursors(reload);
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea && event.storageArea !== localStorage) return;
      if (event.key === CHAT_MESSAGES_STORAGE_KEY || event.key === CHAT_READ_STORAGE_KEY || event.key === null) reload();
    };
    const onVisible = () => { if (document.visibilityState === 'visible') reload(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', reload);
    document.addEventListener('visibilitychange', onVisible);
    const stopInbox = inbox.start();
    return () => {
      stopInbox(); stopMessages(); stopReads();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', reload);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [inbox]);

  const unreadCount = snapshot.loading ? null : snapshot.summaries.reduce((sum, item) => sum + item.unreadCount, 0);
  return <ChatInboxContext.Provider value={{ ...snapshot, unreadCount, refresh: inbox.refresh, markRead: inbox.markRead }}>{children}</ChatInboxContext.Provider>;
}

export function useChatInbox() {
  const context = useContext(ChatInboxContext);
  if (!context) throw new Error('useChatInbox cần nằm trong ChatInboxProvider.');
  return context;
}
