export interface MemberConversationSummary {
  id: string; title: string | null; conversationType: string; participantNames: string[];
  lastMessage: { body: string; sentAt: string; senderUserId: string } | null; unreadCount: number;
}
export interface MemberConversationMessage { id: string; senderUserId: string; senderName: string; body: string; sentAt: string; isOwn: boolean }
export interface MemberConversationDetail {
  conversationId: string; title: string | null; conversationType: string; peerUserId: string | null;
  participantNames: string[]; messages: MemberConversationMessage[];
}
export type MemberCallMedia = "audio" | "video";
export type MemberCallSignalKind = "offer" | "answer" | "ice" | "end";
export interface MemberCallSignal { id: number; callId: string; fromUserId: string; kind: MemberCallSignalKind; media: MemberCallMedia; payload: Record<string, unknown> | null }
