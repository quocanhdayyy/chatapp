import { apiClient } from '../core/network/apiClient';
import type { Conversation, ConversationSummary, Message } from '../types/chat';

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

export function sendMessage(
  conversationId: string,
  content: string,
): Promise<Message> {
  return apiClient.post(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    { content },
  );
}

export function getConversationSummaries(): Promise<ConversationSummary[]> {
  return apiClient.get('/conversations/summary');
}

export function markConversationRead(
  conversationId: string,
  messageId: string,
): Promise<ConversationSummary> {
  return apiClient.post(
    `/conversations/${encodeURIComponent(conversationId)}/read`,
    { messageId },
  );
}
