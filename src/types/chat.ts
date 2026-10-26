export type Conversation = {
  id: string;
  participantIds: [string, string];
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: number;
};

// Mỗi người có mốc đọc riêng trong từng cuộc trò chuyện.
export type ChatReadCursor = {
  userId: string;
  conversationId: string;
  messageId: string;
};

export type ConversationSummary = {
  conversationId: string;
  lastMessage: Message | null;
  lastReadMessageId: string | null;
  unreadCount: number;
};
