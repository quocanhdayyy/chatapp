export type Conversation = {
  id: string;
  participantIds: [string, string];
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: number;
};