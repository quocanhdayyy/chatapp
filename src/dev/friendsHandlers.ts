import { ApiError } from '../core/network/ApiError';
import type { HttpRequest } from '../core/network/contracts';
import { saveSocialState } from '../storage/social';
import { readMockSocialState } from './socialState';
import { notificationsAfterFriendChange } from './notificationData';
import { loadProfile } from '../storage/profile';
import type { FriendEntry, FriendRelation } from '../types/friends';
import { demoPeople } from './friendsData';

function requirePerson(personId: string) {
  const person = demoPeople.find((item) => item.id === personId);
  if (!person) throw new ApiError('Không tìm thấy người dùng.', 404, 'PERSON_NOT_FOUND');
  return person;
}

function between(relation: FriendRelation, firstId: string, secondId: string): boolean {
  return (relation.fromId === firstId && relation.toId === secondId) ||
    (relation.fromId === secondId && relation.toId === firstId);
}

function listPeople(userId: string, relations: FriendRelation[]): FriendEntry[] {
  return demoPeople.filter((person) => person.id !== userId).map((person) => {
    const relation = relations.find((item) => between(item, userId, person.id));
    const profile = loadProfile(person.id);
    return {
      ...person,
      name: profile?.name ?? person.name,
      bio: profile?.bio ?? person.bio,
      relationship: !relation ? 'none' : relation.status === 'accepted' ? 'friends' : relation.toId === userId ? 'incoming' : 'outgoing',
      relationId: relation?.id ?? null,
    };
  });
}

function sendRequest(userId: string, personId: string, relations: FriendRelation[]) {
  requirePerson(personId);
  if (userId === personId) throw new ApiError('Bạn không thể kết bạn với chính mình.', 400, 'SELF_REQUEST');
  const existing = relations.find((item) => between(item, userId, personId));
  if (existing) {
    const message = existing.status === 'accepted' ? 'Hai bạn đã là bạn bè.' : existing.fromId === userId
      ? 'Bạn đã gửi lời mời cho người này.'
      : 'Người này đã gửi lời mời cho bạn. Hãy mở mục Lời mời nhận.';
    throw new ApiError(message, 409, 'RELATIONSHIP_EXISTS');
  }
  return [...relations, { id: crypto.randomUUID(), fromId: userId, toId: personId, status: 'pending' } satisfies FriendRelation];
}

function changeRequest(userId: string, requestId: string, action: string, relations: FriendRelation[]) {
  const request = relations.find((item) => item.id === requestId && item.status === 'pending');
  if (!request) throw new ApiError('Lời mời không còn tồn tại. Hãy làm mới danh sách.', 404, 'REQUEST_NOT_FOUND');
  const allowed = action === 'cancel' ? request.fromId === userId : request.toId === userId;
  if (!allowed) throw new ApiError('Bạn không có quyền thực hiện thao tác với lời mời này.', 403, 'FORBIDDEN');

  return action === 'accept'
    ? relations.map((item) => item.id === request.id ? { ...item, status: 'accepted' as const } : item)
    : relations.filter((item) => item.id !== request.id);
}

export function handleFriendsRequest(request: HttpRequest, userId: string): FriendEntry[] {
  requirePerson(userId);
  const state = readMockSocialState();
  const relations = state.relations;
  if (request.method === 'GET' && request.path === '/friends') return listPeople(userId, relations);

  let updated: FriendRelation[];
  if (request.method === 'POST' && request.path === '/friends/requests') {
    const body = request.body as { personId?: unknown } | null;
    if (!body || typeof body.personId !== 'string') throw new ApiError('Thiếu người nhận lời mời.', 400, 'VALIDATION');
    updated = sendRequest(userId, body.personId, relations);
  } else {
    const requestMatch = request.path.match(/^\/friends\/requests\/([^/]+)\/(accept|decline|cancel)$/);
    const removeMatch = request.path.match(/^\/friends\/([^/]+)\/remove$/);
    if (request.method === 'POST' && requestMatch) {
      updated = changeRequest(userId, decodeURIComponent(requestMatch[1]), requestMatch[2], relations);
    } else if (request.method === 'POST' && removeMatch) {
      const personId = decodeURIComponent(removeMatch[1]);
      requirePerson(personId);
      const friendship = relations.find((item) => between(item, userId, personId) && item.status === 'accepted');
      if (!friendship) throw new ApiError('Hai bạn chưa là bạn bè. Hãy làm mới danh sách.', 409, 'NOT_FRIENDS');
      updated = relations.filter((item) => item.id !== friendship.id);
    } else {
      throw new ApiError('Không tìm thấy yêu cầu bạn bè.', 404, 'NOT_FOUND');
    }
  }

  // Chỉ trả kết quả thành công sau khi thay đổi đã được lưu.
  saveSocialState({ version: 2, relations: updated, notifications: notificationsAfterFriendChange(relations, updated, state.notifications) });
  return listPeople(userId, updated);
}
