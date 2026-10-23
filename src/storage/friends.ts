import type { FriendRelation } from '../types/friends';
import { loadSocialState, saveSocialState } from './social';

export { SOCIAL_STORAGE_KEY as FRIENDS_STORAGE_KEY } from './social';

export function loadFriendRelations(): FriendRelation[] | null {
  return loadSocialState()?.relations ?? null;
}

export function saveFriendRelations(relations: FriendRelation[]): void {
  const state = loadSocialState();
  saveSocialState({ version: 2, relations, notifications: state?.notifications ?? [] });
}
