import type { ConversationsRepository } from "../domain/conversations.repository.js";
export class StartConversationUseCase {
  constructor(private readonly repository: ConversationsRepository) {}
  search(userId: string, query: string) { return this.repository.searchUsers(userId, query); }
  start(userId: string, recipientId: string) { return userId === recipientId ? Promise.resolve(null) : this.repository.startDirect(userId, recipientId); }
}
