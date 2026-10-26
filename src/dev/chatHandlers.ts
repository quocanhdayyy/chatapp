import { ApiError } from '../core/network/ApiError';
import { MAX_MESSAGE_LENGTH } from '../core/chat';
import type { HttpRequest } from '../core/network/contracts';
import { loadChatMessages, saveChatMessages } from '../storage/chat';
import type { Conversation, Message } from '../types/chat';
import { initialConversations, initialMessages } from './chatData';

function readMessages(): Message[] {
  return loadChatMessages() ?? initialMessages;
}

function requireConversation(conversationId: string, userId: string): Conversation {
  const conversation = initialConversations.find((item) =>
    item.id === conversationId && item.participantIds.includes(userId));
  if (!conversation) throw new ApiError('Không tìm thấy cuộc trò chuyện.', 404, 'CONVERSATION_NOT_FOUND');
  return conversation;
}

function contentOf(body: unknown): string {
  const input = body as { content?: unknown } | null;
  if (!input || typeof input !== 'object' || Array.isArray(input) || typeof input.content !== 'string') {
    throw new ApiError('Nội dung tin nhắn không hợp lệ.', 400, 'VALIDATION');
  }
  const content = input.content.trim();
  if (!content) throw new ApiError('Vui lòng nhập nội dung tin nhắn.', 400, 'VALIDATION');
  if (content.length > MAX_MESSAGE_LENGTH) {
    throw new ApiError(`Tin nhắn không được vượt quá ${MAX_MESSAGE_LENGTH} ký tự.`, 400, 'VALIDATION');
  }
  return content;
}

function appendMessage(conversationId: string, senderId: string, content: string): Message {
  const message: Message = {
    id: crypto.randomUUID(), conversationId, senderId, content, createdAt: Date.now(),
  };
  saveChatMessages([...readMessages(), message]);
  return message;
}

export function handleChatRequest(
  request: HttpRequest,
  userId: string,
): Conversation[] | Message[] | Message {
  if (request.path === '/conversations') {
    if (request.method !== 'GET') throw new ApiError('Chưa hỗ trợ thao tác này.', 405, 'METHOD_NOT_ALLOWED');
    return initialConversations
      .filter((conversation) => conversation.participantIds.includes(userId))
      .map((conversation): Conversation => ({ ...conversation, participantIds: [...conversation.participantIds] }));
  }

  const match = request.path.match(/^\/conversations\/([^/]+)\/messages$/);
  if (!match) throw new ApiError('Không tìm thấy yêu cầu chat.', 404, 'NOT_FOUND');
  const conversationId = decodeURIComponent(match[1]);
  requireConversation(conversationId, userId);

  if (request.method === 'GET') {
    return readMessages()
      .filter((message) => message.conversationId === conversationId)
      .sort((first, second) => first.createdAt - second.createdAt)
      .map((message) => ({ ...message }));
  }
  if (request.method === 'POST') return appendMessage(conversationId, userId, contentOf(request.body));
  throw new ApiError('Chưa hỗ trợ thao tác này.', 405, 'METHOD_NOT_ALLOWED');
}

export function handleChatDemoRequest(request: HttpRequest, userId: string): Message {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    throw new ApiError('Không tìm thấy yêu cầu.', 404, 'NOT_FOUND');
  }
  const match = request.path.match(/^\/dev\/chat\/([^/]+)\/incoming$/);
  if (!match) throw new ApiError('Không tìm thấy yêu cầu.', 404, 'NOT_FOUND');
  if (request.method !== 'POST') throw new ApiError('Chưa hỗ trợ thao tác này.', 405, 'METHOD_NOT_ALLOWED');

  const conversationId = decodeURIComponent(match[1]);
  const conversation = requireConversation(conversationId, userId);
  const otherId = conversation.participantIds.find((id) => id !== userId);
  if (!otherId) throw new ApiError('Không tìm thấy người nhận.', 404, 'PERSON_NOT_FOUND');

  // Mô phỏng phía người kia. Không thay phiên đăng nhập hoặc nhận senderId từ body.
  return appendMessage(conversationId, otherId, contentOf(request.body));
}
