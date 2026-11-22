export interface MemberConversationSummary {
  id: string; title: string | null; conversationType: string; participantNames: string[]; participantRoles: string[];
  lastMessage: { body: string; sentAt: string; senderUserId: string } | null; unreadCount: number;
}
export interface MemberConversationMessage { id: string; senderUserId: string; senderName: string; body: string; sentAt: string; isOwn: boolean; messageType?: string; attachments?: { id: string; filename: string; size: number }[] }
export interface MemberConversationDetail { conversationId: string; title: string | null; conversationType: string; peerUserId: string | null; participantNames: string[]; messages: MemberConversationMessage[] }
export interface MemberMessagesRepository {
  listConversations(userId: string): Promise<MemberConversationSummary[]>;
  readConversation(userId: string, conversationId: string, now: Date): Promise<MemberConversationDetail | null>;
  markReadThrough(userId: string, conversationId: string, messageId: string): Promise<boolean>;
  sendMessage(userId: string, conversationId: string, body: string, now: Date): Promise<MemberConversationMessage | null>;
  findCallPeer(userId: string, conversationId: string): Promise<string | null>;
}
