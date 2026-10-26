export type NotificationTarget =
  | { screen: 'friends'; tab: 'friends' | 'incoming' }
  | { screen: 'profile' }
  | { screen: 'post'; postId: string };

export type AppNotification = {
  id: string;
  recipientId: string;
  type: 'friend_request' | 'friend_accepted' | 'friend_connected' | 'followed_post' | 'system';
  actorName: string | null;
  message: string;
  sourceId: string | null;
  createdAt: number;
  readAt: number | null;
  target: NotificationTarget;
};
