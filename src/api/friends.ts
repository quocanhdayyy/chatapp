import { apiClient } from '../core/network/apiClient';
import type { FriendEntry } from '../types/friends';

export type { FriendEntry, FriendAction, FriendshipStatus, FriendTab } from '../types/friends';

export function getFriends(): Promise<FriendEntry[]> {
  return apiClient.get('/friends');
}

export function sendFriendRequest(personId: string): Promise<FriendEntry[]> {
  return apiClient.post('/friends/requests', { personId });
}

export function acceptFriendRequest(requestId: string): Promise<FriendEntry[]> {
  return apiClient.post(`/friends/requests/${encodeURIComponent(requestId)}/accept`, {});
}

export function declineFriendRequest(requestId: string): Promise<FriendEntry[]> {
  return apiClient.post(`/friends/requests/${encodeURIComponent(requestId)}/decline`, {});
}

export function cancelFriendRequest(requestId: string): Promise<FriendEntry[]> {
  return apiClient.post(`/friends/requests/${encodeURIComponent(requestId)}/cancel`, {});
}

export function removeFriend(personId: string): Promise<FriendEntry[]> {
  return apiClient.post(`/friends/${encodeURIComponent(personId)}/remove`, {});
}

export function followPerson(personId: string): Promise<FriendEntry[]> {
  return apiClient.post(`/friends/${encodeURIComponent(personId)}/follow`, {});
}

export function unfollowPerson(personId: string): Promise<FriendEntry[]> {
  return apiClient.post(`/friends/${encodeURIComponent(personId)}/unfollow`, {});
}
