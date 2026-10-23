import { apiClient } from '../core/network/apiClient';
import type { AuthSession } from '../types/auth';

export type { User, AuthSession } from '../types/auth';
export type ChangePasswordInput = { currentPassword: string; newPassword: string; confirmPassword: string };

export function login(email: string, password: string): Promise<AuthSession> {
  return apiClient.post('/auth/login', { email, password }, false);
}

export function logout(refreshToken: string): Promise<void> {
  return apiClient.post('/auth/logout', { refreshToken }, false);
}

export function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
  return apiClient.post('/auth/change-password', { ...input, userId });
}
