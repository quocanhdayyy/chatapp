import { mockChatTransport } from '../dev/mockChatTransport';
import type { Message } from '../types/chat';

export type ChatMessageTransport = {
  subscribe: (
    userId: string,
    onMessage: (message: Message) => void,
    onError?: (error: Error) => void,
  ) => () => void;
};

// Khi có server, thay adapter này bằng kết nối WebSocket/STOMP.
export const chatTransport: ChatMessageTransport = mockChatTransport;
