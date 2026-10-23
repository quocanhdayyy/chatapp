import { ApiError } from '../core/network/ApiError';
import type { AuthSession, User } from '../types/auth';

type RefreshRecord = { userId: string; expiresAt: number };
type Claims = { sub: string; exp: number; sid: string };
const KEY = 'chatapp-mock-refresh-tokens';
export const ACCESS_TOKEN_TTL = 2 * 60 * 1000;
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;

function readRecords(): Record<string, RefreshRecord> {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return {};
    return parsed;
  } catch { return {}; }
}

function encode(value: object) {
  return btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function issueSession(user: User, previousRefreshToken?: string): AuthSession {
  const records = readRecords();
  const previous = previousRefreshToken ? records[previousRefreshToken] : null;
  const refreshToken = `mock-refresh-${crypto.randomUUID()}`;
  const expiresAt = Date.now() + ACCESS_TOKEN_TTL;
  records[refreshToken] = { userId: user.id, expiresAt: previous?.expiresAt ?? Date.now() + REFRESH_TOKEN_TTL };
  if (previousRefreshToken) delete records[previousRefreshToken];
  localStorage.setItem(KEY, JSON.stringify(records));

  // JWT giả để học luồng FE. Phần .mock không phải chữ ký bảo mật của server.
  const accessToken = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: user.id, exp: expiresAt, sid: refreshToken })}.mock`;
  return { user, accessToken, refreshToken, expiresAt };
}

export function validateRefreshToken(token: string): string {
  const record = readRecords()[token];
  if (!record || typeof record.userId !== 'string' || !Number.isFinite(record.expiresAt) || record.expiresAt <= Date.now()) {
    throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401, 'SESSION_EXPIRED');
  }
  return record.userId;
}

export function validateAccessToken(token: string): string {
  let claims: Claims;
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || signature !== 'mock') throw new Error();
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    claims = JSON.parse(atob(base64));
    if (typeof claims.sub !== 'string' || typeof claims.sid !== 'string' || !Number.isFinite(claims.exp)) throw new Error();
  } catch {
    throw new ApiError('Thông tin đăng nhập không hợp lệ.', 401, 'INVALID_TOKEN');
  }
  if (claims.exp <= Date.now()) throw new ApiError('Token đã hết hạn.', 401, 'TOKEN_EXPIRED');
  if (validateRefreshToken(claims.sid) !== claims.sub) throw new ApiError('Phiên đăng nhập không hợp lệ.', 401, 'INVALID_TOKEN');
  return claims.sub;
}

export function revokeSession(token: string) {
  const records = readRecords();
  delete records[token];
  localStorage.setItem(KEY, JSON.stringify(records));
}
