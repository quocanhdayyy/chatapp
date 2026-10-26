import { ApiError } from '../core/network/ApiError';
import type { HttpRequest } from '../core/network/contracts';
import type { Conversation, Message } from '../types/chat';
import { initialConversations, initialMessages } from './chatData';

export function handleChatRequest(
  request: HttpRequest,
  userId: string,
): Conversation[] | Message[] {
  if (request.method !== 'GET') {
    throw new ApiError(
      'Chưa hỗ trợ thao tác chat này.',
      405,
      'METHOD_NOT_ALLOWED',
    );
  }

  // Lấy các cuộc trò chuyện mà người đang đăng nhập tham gia.
  if (request.path === '/conversations') {
    return initialConversations
      .filter((conversation) =>
        conversation.participantIds.includes(userId),
      )
      .map((conversation): Conversation => ({
        ...conversation,
        participantIds: [...conversation.participantIds],
      }));
  }

  // Nhận đường dẫn dạng /conversations/chat-1/messages.
  const match = request.path.match(
    /^\/conversations\/([^/]+)\/messages$/,
  );

  if (!match) {
    throw new ApiError(
      'Không tìm thấy yêu cầu chat.',
      404,
      'NOT_FOUND',
    );
  }

  const conversationId = decodeURIComponent(match[1]);

  const conversation = initialConversations.find(
    (item) =>
      item.id === conversationId &&
      item.participantIds.includes(userId),
  );

  if (!conversation) {
    throw new ApiError(
      'Không tìm thấy cuộc trò chuyện.',
      404,
      'CONVERSATION_NOT_FOUND',
    );
  }

  // Lấy tin thuộc cuộc trò chuyện, xếp từ cũ đến mới.
  return initialMessages
    .filter((message) => message.conversationId === conversationId)
    .sort((first, second) => first.createdAt - second.createdAt)
    .map((message) => ({ ...message }));
}