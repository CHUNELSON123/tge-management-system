export interface ConversationsRepository {
  searchUsers(userId: string, query: string): Promise<{ id: string; firstName: string; lastName: string; role: { name: string } }[]>;
  startDirect(userId: string, recipientId: string): Promise<{ id: string } | null>;
}
