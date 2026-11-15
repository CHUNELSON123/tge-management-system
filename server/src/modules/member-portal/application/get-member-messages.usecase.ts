import type { MemberConversationDetail, MemberConversationMessage, MemberConversationSummary, MemberMessagesRepository } from "../domain/member-messages.repository.js";
export class GetMemberMessagesUseCase {
  constructor(private readonly repository: MemberMessagesRepository) {}
  list(userId: string): Promise<MemberConversationSummary[]> { return this.repository.listConversations(userId); }
  read(userId: string, conversationId: string, now = new Date()): Promise<MemberConversationDetail | null> { return this.repository.readConversation(userId, conversationId, now); }
  send(userId: string, conversationId: string, body: string, now = new Date()): Promise<MemberConversationMessage | null> { return this.repository.sendMessage(userId, conversationId, body, now); }
}
