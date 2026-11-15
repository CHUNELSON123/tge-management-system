import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { MemberNotification, MemberNotificationsRepository } from "../domain/member-notifications.repository.js";
export class PrismaMemberNotificationsRepository implements MemberNotificationsRepository {
  constructor(private readonly database = prisma) {}
  async listForUser(userId: string): Promise<MemberNotification[]> {
    const records = await this.database.notification.findMany({ where: { userId }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], select: { id: true, title: true, body: true, notificationType: true, readAt: true, createdAt: true } });
    return records.map((record) => ({ ...record, readAt: record.readAt?.toISOString() ?? null, createdAt: record.createdAt.toISOString() }));
  }
  async markReadForUser(userId: string, notificationId: string, now: Date): Promise<boolean> {
    const result = await this.database.notification.updateMany({ where: { id: notificationId, userId, readAt: null }, data: { readAt: now } });
    if (result.count > 0) return true;
    return Boolean(await this.database.notification.findFirst({ where: { id: notificationId, userId }, select: { id: true } }));
  }
  async markAllReadForUser(userId: string, now: Date): Promise<number> {
    const result = await this.database.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: now } });
    return result.count;
  }
}
