export interface AdminHeaderNotification {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  conversationId: string | null;
}

export interface AdminHeaderData {
  notifications: AdminHeaderNotification[];
  unreadCount: number;
}
