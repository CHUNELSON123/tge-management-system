export interface MemberNotification {
  id: string; title: string; body: string; notificationType: string; readAt: string | null; createdAt: string;
}
export interface MemberNotificationsRepository {
  listForUser(userId: string): Promise<MemberNotification[]>;
  markReadForUser(userId: string, notificationId: string, now: Date): Promise<boolean>;
  markAllReadForUser(userId: string, now: Date): Promise<number>;
}
