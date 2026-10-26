import { loadPostNotifications } from '../storage/posts';
import { mergePostNotifications } from './postNotificationData';
import { followsForFriends } from '../utils/follows';
import { loadSocialState, type SocialState } from '../storage/social';
import { initialFriendRelations } from './friendsData';
import { createInitialNotifications } from './notificationData';

export function readMockSocialState(): SocialState {
  const saved = loadSocialState();
  const relations = saved?.relations ?? initialFriendRelations.map((item) => ({ ...item }));
  return { version: 3, relations, follows: saved?.follows ?? followsForFriends(relations), notifications: mergePostNotifications(saved?.notifications ?? createInitialNotifications(relations), loadPostNotifications()) };
}
