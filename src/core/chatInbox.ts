import { getConversationSummaries, markConversationRead } from '../api/chat';
import type { ConversationSummary } from '../types/chat';

type InboxSnapshot = {
  summaries: ConversationSummary[];
  loading: boolean;
  error: string;
};

type InboxApi = {
  load: typeof getConversationSummaries;
  mark: typeof markConversationRead;
};

// Một nguồn dữ liệu chung cho badge trên Header và danh sách ChatScreen.
export function createChatInbox(api: InboxApi = { load: getConversationSummaries, mark: markConversationRead }) {
  let snapshot: InboxSnapshot = { summaries: [], loading: true, error: '' };
  let active = false;
  let version = 0;
  const listeners = new Set<() => void>();

  function publish(next: InboxSnapshot) {
    snapshot = next;
    listeners.forEach((listener) => listener());
  }

  async function refresh() {
    if (!active) return;
    const requestVersion = ++version;
    try {
      const summaries = await api.load();
      // Kết quả cũ trả về muộn không được làm badge tăng trở lại.
      if (active && requestVersion === version) publish({ summaries, loading: false, error: '' });
    } catch (error) {
      if (active && requestVersion === version) {
        publish({ ...snapshot, loading: false, error: error instanceof Error ? error.message : 'Không tải được số tin chưa đọc.' });
      }
    }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    start() {
      active = true;
      void refresh();
      return () => { active = false; version += 1; };
    },
    refresh,
    async markRead(conversationId: string, messageId: string) {
      if (!active) return;
      await api.mark(conversationId, messageId);
      if (active) await refresh();
    },
  };
}
