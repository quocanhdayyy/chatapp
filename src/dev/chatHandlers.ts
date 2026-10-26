import { ApiError } from '../core/network/ApiError';
import { MAX_MESSAGE_LENGTH } from '../core/chat';
import type { HttpRequest } from '../core/network/contracts';
import { loadChatMessages, saveChatMessages } from '../storage/chat';
import type { Conversation, Message } from '../types/chat';
import { initialConversations, initialMessages } from './chatData';

function readMessages(): Message[] {
  return loadChatMessages() ?? initialMessages;
}

export function handleChatRequest(
  request: HttpRequest,
  userId: string,
): Conversation[] | Message[] | Message {
  // Lấy danh sách cuộc trò chuyện.
  if (request.path === '/conversations') {
    if (request.method !== 'GET') {
      throw new ApiError(
        'Chưa hỗ trợ thao tác này.',
        405,
        'METHOD_NOT_ALLOWED',
      );
    }

    return initialConversations
      .filter((conversation) =>
        conversation.participantIds.includes(userId),
      )
      .map((conversation): Conversation => ({
        ...conversation,
        participantIds: [...conversation.participantIds],
      }));
  }

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

  // Kiểm tra người đang đăng nhập có tham gia không.
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

  // GET: đọc lịch sử tin nhắn.
  if (request.method === 'GET') {
    return readMessages()
      .filter((message) => message.conversationId === conversationId)
      .sort((first, second) => first.createdAt - second.createdAt)
      .map((message) => ({ ...message }));
  }

  // POST: gửi một tin nhắn mới.
  if (request.method === 'POST') {
    const body = request.body as { content?: unknown } | null;

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      typeof body.content !== 'string'
    ) {
      throw new ApiError(
        'Nội dung tin nhắn không hợp lệ.',
        400,
        'VALIDATION',
      );
    }

    const content = body.content.trim();

    if (!content) {
      throw new ApiError(
        'Vui lòng nhập nội dung tin nhắn.',
        400,
        'VALIDATION',
      );
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new ApiError(
        `Tin nhắn không được vượt quá ${MAX_MESSAGE_LENGTH} ký tự.`,
        400,
        'VALIDATION',
      );
    }

    const message: Message = {
      id: crypto.randomUUID(),
      conversationId,
      senderId: userId,
      content,
      createdAt: Date.now(),
    };

    const messages = readMessages();

    saveChatMessages([...messages, message]);

    return message;
  }

  throw new ApiError(
    'Chưa hỗ trợ thao tác này.',
    405,
    'METHOD_NOT_ALLOWED',
  );
}
