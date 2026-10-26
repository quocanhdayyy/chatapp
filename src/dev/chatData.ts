import type { Conversation, Message } from '../types/chat';

export const initialConversations: Conversation[] = [
  {
    id: 'chat-1',
    participantIds: ['1', '2'],
  },
];

export const initialMessages: Message[] = [
  {
    id: 'message-1',
    conversationId: 'chat-1',
    senderId: '2',
    content: 'Chào Anh!',
    createdAt: Date.parse('2026-10-26T09:00:00+07:00'),
  },
  {
    id: 'message-2',
    conversationId: 'chat-1',
    senderId: '1',
    content: 'Chào Mai!',
    createdAt: Date.parse('2026-10-26T09:01:00+07:00'),
  },
];