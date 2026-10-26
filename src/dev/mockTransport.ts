import { handleNotificationsRequest } from './notificationsHandlers';
import { ApiError } from '../core/network/ApiError';
import type { HttpRequest, HttpResponse } from '../core/network/contracts';
import { handleFriendsRequest } from './friendsHandlers';
import { changeUserPassword, loginUser } from './authHandlers';
import { readUserProfile, writeUserProfile } from './profileHandlers';
import { issueSession, revokeSession, validateAccessToken, validateRefreshToken } from './mockTokens';
import { handleChatRequest } from './chatHandlers';
let delayMs = 400;
let online = true;
let nextFailure: number | null = null;

export function configureMockNetwork(options: { delayMs?: number; online?: boolean; failNext?: number | null }) {
  if (options.delayMs !== undefined) delayMs = options.delayMs;
  if (options.online !== undefined) online = options.online;
  if (options.failNext !== undefined) nextFailure = options.failNext;
}

function bodyOf(request: HttpRequest): Record<string, unknown> {
  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
    throw new ApiError('Dữ liệu gửi lên không hợp lệ.', 400, 'VALIDATION');
  }
  return request.body as Record<string, unknown>;
}

function stringField(body: Record<string, unknown>, key: string): string {
  if (typeof body[key] !== 'string') throw new ApiError('Thiếu thông tin bắt buộc.', 400, 'VALIDATION');
  return body[key];
}

async function handle(request: HttpRequest): Promise<unknown> {
  if (request.path === '/auth/login' && request.method === 'POST') {
    const body = bodyOf(request);
    try {
      const result = await loginUser(stringField(body, 'email'), stringField(body, 'password'));
      return issueSession(result.user);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Email hoặc mật khẩu không đúng.', 401, 'INVALID_CREDENTIALS');
    }
  }

  if (request.path === '/auth/refresh' && request.method === 'POST') {
    const token = stringField(bodyOf(request), 'refreshToken');
    const id = validateRefreshToken(token);
    const profile = await readUserProfile(id);
    return issueSession({ id: profile.id, name: profile.name, email: profile.email }, token);
  }

  if (request.path === '/auth/logout' && request.method === 'POST') {
    revokeSession(stringField(bodyOf(request), 'refreshToken'));
    return null;
  }

  const authorization = request.headers?.Authorization;
  if (!authorization?.startsWith('Bearer ')) throw new ApiError('Vui lòng đăng nhập.', 401, 'UNAUTHENTICATED');
  const userId = validateAccessToken(authorization.slice(7));
  if (
  request.path === '/conversations' ||
  request.path.startsWith('/conversations/')
) {
  return handleChatRequest(request, userId);
}

  if (request.path === '/notifications' || request.path.startsWith('/notifications/')) {
    return handleNotificationsRequest(request, userId);
  }

  if (request.path === '/friends' || request.path.startsWith('/friends/')) {
    return handleFriendsRequest(request, userId);
  }

  if (request.path === '/users/me' && request.method === 'GET') {
    return readUserProfile(userId);
  }

  const profileMatch = request.path.match(/^\/users\/([^/]+)$/);
  if (profileMatch) {
    if (decodeURIComponent(profileMatch[1]) !== userId) throw new ApiError('Không có quyền sửa hồ sơ này.', 403, 'FORBIDDEN');
    if (request.method === 'GET') return readUserProfile(userId);
    if (request.method === 'PATCH') {
      const body = bodyOf(request);
      return writeUserProfile(userId, body);
    }
  }

  if (request.path === '/auth/change-password' && request.method === 'POST') {
    const body = bodyOf(request);
    if (stringField(body, 'userId') !== userId) throw new ApiError('Không có quyền đổi mật khẩu tài khoản này.', 403, 'FORBIDDEN');
    return changeUserPassword(userId, {
      currentPassword: stringField(body, 'currentPassword'),
      newPassword: stringField(body, 'newPassword'),
      confirmPassword: stringField(body, 'confirmPassword'),
    });
  }

  throw new ApiError('Không tìm thấy dữ liệu yêu cầu.', 404, 'NOT_FOUND');
}

export async function mockTransport(request: HttpRequest): Promise<HttpResponse> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  if (!online || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
    throw new ApiError('Mất kết nối. Hãy kiểm tra mạng và thử lại.', 0, 'NETWORK');
  }
  if (nextFailure !== null) {
    const status = nextFailure;
    nextFailure = null;
    return { status, message: 'Không tải được dữ liệu. Hãy thử lại.', code: 'MOCK_FAILURE' };
  }
  try {
    return { status: 200, data: await handle(request) };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.status, message: error.message, code: error.code };
    return { status: 400, message: error instanceof Error ? error.message : 'Yêu cầu không thành công.', code: 'VALIDATION' };
  }
}
