import { apiClient } from '../core/network/apiClient';
import type { Conversation, Message } from '../types/chat';

export function getConversations(): Promise<Conversation[]> {
  return apiClient.get('/conversations');
}

export function getMessages(
  conversationId: string,
): Promise<Message[]> {
  return apiClient.get(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
  );
}