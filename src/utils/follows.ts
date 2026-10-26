import type { FollowRelation, FriendRelation } from '../types/friends';

export function followsForFriends(relations: FriendRelation[]): FollowRelation[] {
  return relations.filter((relation) => relation.status === 'accepted').flatMap((relation) => [
    { fromId: relation.fromId, toId: relation.toId },
    { fromId: relation.toId, toId: relation.fromId },
  ]);
}

export function addNewFriendFollows(follows: FollowRelation[], before: FriendRelation[], after: FriendRelation[]): FollowRelation[] {
  const acceptedBefore = new Set(before.filter((relation) => relation.status === 'accepted').map((relation) => relation.id));
  const newlyAccepted = after.filter((relation) => relation.status === 'accepted' && !acceptedBefore.has(relation.id));
  const result = follows.map((follow) => ({ ...follow }));
  for (const follow of followsForFriends(newlyAccepted)) {
    if (!result.some((item) => item.fromId === follow.fromId && item.toId === follow.toId)) result.push(follow);
  }
  return result;
}
