import { loadProfile } from '../storage/profile';
import type { FriendRelation } from '../types/friends';
import type { AppNotification } from '../types/notifications';
import { demoPeople } from './friendsData';

const initialTime = Date.now();

function personName(id: string) {
  return loadProfile(id)?.name ?? demoPeople.find((person) => person.id === id)?.name ?? 'Thành viên';
}

function requestNotification(relation: FriendRelation, createdAt: number): AppNotification {
  const actorName = personName(relation.fromId);
  return {
    id: `friend-request:${relation.id}`, recipientId: relation.toId,
    type: 'friend_request', actorName, message: `${actorName} đã gửi cho bạn lời mời kết bạn.`,
    sourceId: relation.id, createdAt, readAt: null, target: { screen: 'friends', tab: 'incoming' },
  };
}

export function createInitialNotifications(relations: FriendRelation[]): AppNotification[] {
  return [
    ...relations.filter((relation) => relation.status === 'pending').map((relation, index) => requestNotification(relation, initialTime - (index + 1) * 60000)),
    {
      id: 'welcome:1', recipientId: '1', type: 'system', actorName: null,
      message: 'Chào mừng bạn đến với ChatApp.', sourceId: null,
      createdAt: initialTime - 86400000, readAt: null, target: { screen: 'profile' },
    },
  ];
}

export function notificationsAfterFriendChange(
  previous: FriendRelation[], next: FriendRelation[], notifications: AppNotification[],
): AppNotification[] {
  const now = Date.now();
  // Lời mời đã xử lý vẫn nằm trong lịch sử nhưng không còn là thông báo chưa đọc.
  const handled = new Set(previous.filter((relation) => relation.status === 'pending' &&
    !next.some((item) => item.id === relation.id && item.status === 'pending')).map((relation) => relation.id));
  const updated = notifications.map((item) => item.type === 'friend_request' && item.sourceId && handled.has(item.sourceId)
    ? { ...item, readAt: item.readAt ?? now, target: { screen: 'friends' as const, tab: 'friends' as const } } : item);
  const ids = new Set(updated.map((item) => item.id));
  function append(item: AppNotification) {
    if (!ids.has(item.id)) { updated.push(item); ids.add(item.id); }
  }

  next.forEach((relation) => {
    const before = previous.find((item) => item.id === relation.id);
    if (!before && relation.status === 'pending') append(requestNotification(relation, now));
    if (before?.status === 'pending' && relation.status === 'accepted') {
      const receiverName = personName(relation.toId);
      const senderName = personName(relation.fromId);
      append({ id: `friend-accepted:${relation.id}`, recipientId: relation.fromId,
        type: 'friend_accepted', actorName: receiverName, message: `${receiverName} đã chấp nhận lời mời kết bạn của bạn.`,
        sourceId: relation.id, createdAt: now, readAt: null, target: { screen: 'friends', tab: 'friends' } });
      append({ id: `friend-connected:${relation.id}`, recipientId: relation.toId,
        type: 'friend_connected', actorName: senderName, message: `Bạn và ${senderName} đã trở thành bạn bè.`,
        sourceId: relation.id, createdAt: now, readAt: null, target: { screen: 'friends', tab: 'friends' } });
    }
  });
  return updated;
}
