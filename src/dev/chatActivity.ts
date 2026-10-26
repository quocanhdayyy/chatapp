import { ApiError } from '../core/network/ApiError';
import { apiClient } from '../core/network/apiClient';
import type { Message } from '../types/chat';

// Chỉ được gọi khi người phát triển bấm nút nhận tin thử.
export async function simulateIncomingMessage(
  conversationId: string,
  content = 'Bạn nhận được tin nhắn này chưa?',
): Promise<Message> {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    throw new ApiError('Không tìm thấy yêu cầu.', 404, 'NOT_FOUND');
  }

  return apiClient.post(`/dev/chat/${encodeURIComponent(conversationId)}/incoming`, { content });
}
