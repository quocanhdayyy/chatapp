import { apiClient } from '../core/network/apiClient';
import type { Profile, UpdateProfileInput } from '../types/profile';
export type { Profile, UpdateProfileInput } from '../types/profile';
export { PROFILE_TEXT_LIMITS } from '../types/profile';


export function getMyProfile(): Promise<Profile> {
  return apiClient.get('/users/me');
}

export function getProfile(userId: string): Promise<Profile> {
  return apiClient.get(`/users/${encodeURIComponent(userId)}`);
}

export function updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
  return apiClient.patch(`/users/${encodeURIComponent(userId)}`, input);
}
