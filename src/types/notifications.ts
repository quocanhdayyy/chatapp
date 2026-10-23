export type NotificationTarget =
  | { screen: 'friends'; tab: 'friends' | 'incoming' }
  | { screen: 'profile' };

export type AppNotification = {
  id: string;
  recipientId: string;
  type: 'friend_request' | 'friend_accepted' | 'friend_connected' | 'system';
  actorName: string | null;
  message: string;
  sourceId: string | null;
  createdAt: number;
  readAt: number | null;
  target: NotificationTarget;
};
