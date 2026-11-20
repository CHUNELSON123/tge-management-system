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

export interface AdminHeaderRepository {
  loadHeader(userId: string): Promise<AdminHeaderData>;
  getProfilePhoto(userId: string): Promise<{ contentType: string; data: Uint8Array } | null>;
  markNotificationRead(userId: string, notificationId: string, now: Date): Promise<boolean>;
}
