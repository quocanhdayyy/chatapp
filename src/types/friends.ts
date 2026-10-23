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

export type FriendshipStatus = 'none' | 'friends' | 'incoming' | 'outgoing';

export type FriendEntry = FriendPerson & {
  relationship: FriendshipStatus;
  relationId: string | null;
};

export type FriendAction = 'send' | 'accept' | 'decline' | 'cancel' | 'remove';

export type FriendTab = 'friends' | 'incoming' | 'outgoing' | 'discover';
