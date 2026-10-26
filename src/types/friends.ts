export type FriendPerson = {
  id: string;
  name: string;
  email: string;
  bio: string;
};

export type FriendRelation = {
  id: string;
  fromId: string;
  toId: string;
  status: 'pending' | 'accepted';
};

export type FollowRelation = { fromId: string; toId: string };

export type FriendshipStatus = 'none' | 'friends' | 'incoming' | 'outgoing';

export type FriendEntry = FriendPerson & {
  relationship: FriendshipStatus;
  relationId: string | null;
  isFollowing: boolean;
  followsYou: boolean;
};

export type FriendAction = 'send' | 'accept' | 'decline' | 'cancel' | 'remove' | 'follow' | 'unfollow';

export type FriendTab = 'friends' | 'incoming' | 'outgoing' | 'discover' | 'following' | 'followers';
