import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { AdminHeaderData, AdminHeaderRepository } from "../domain/admin-header.repository.js";

export class PrismaAdminHeaderRepository implements AdminHeaderRepository {
  async loadHeader(userId: string): Promise<AdminHeaderData> {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        select: { id: true, title: true, body: true, readAt: true, createdAt: true, conversationId: true },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        take: 5,
      }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return {
      notifications: notifications.map(({ id, title, body, readAt, createdAt, conversationId }) => ({ id, title, body, conversationId, readAt: readAt?.toISOString() ?? null, createdAt: createdAt.toISOString() })),
      unreadCount,
    };
  }

  async getProfilePhoto(userId: string) {
    const profilePhoto = await prisma.memberProfilePhoto.findUnique({ where: { userId }, select: { contentType: true, data: true } });
    return profilePhoto ? { contentType: profilePhoto.contentType, data: profilePhoto.data } : null;
  }

  async markNotificationRead(userId: string, notificationId: string, now: Date): Promise<boolean> {
    const result = await prisma.notification.updateMany({ where: { id: notificationId, userId, readAt: null }, data: { readAt: now } });
    if (result.count > 0) return true;
    return Boolean(await prisma.notification.findFirst({ where: { id: notificationId, userId }, select: { id: true } }));
  }
}
