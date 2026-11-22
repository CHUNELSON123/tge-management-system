import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { ConversationsRepository } from "../domain/conversations.repository.js";
const roles = ["Member", "Mentor", "System Administrator", "Organisation Administrator"];
export class PrismaConversationsRepository implements ConversationsRepository {
  searchUsers(userId: string, query: string) {
    const words = query.trim().split(/\s+/);
    return prisma.user.findMany({ where: {
      id: { not: userId }, status: "ACTIVE", deletedAt: null, role: { name: { in: roles } },
      AND: words.map((word) => ({ OR: [
        { firstName: { contains: word, mode: "insensitive" as const } },
        { lastName: { contains: word, mode: "insensitive" as const } },
        { email: { contains: word, mode: "insensitive" as const } },
      ] })),
    }, orderBy: [{ firstName: "asc" }, { lastName: "asc" }], take: 20, select: { id: true, firstName: true, lastName: true, role: { select: { name: true } } } });
  }
  async startDirect(userId: string, recipientId: string) {
    return prisma.$transaction(async (tx) => {
      const key = [userId, recipientId].sort().join(":");
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key})::bigint)`;
      const recipient = await tx.user.findFirst({ where: { id: recipientId, status: "ACTIVE", deletedAt: null, role: { name: { in: roles } } }, select: { id: true } });
      if (!recipient) return null;
      const existing = await tx.conversation.findFirst({ where: { conversationType: "direct", AND: [{ participants: { some: { userId } } }, { participants: { some: { userId: recipientId } } }, { participants: { every: { userId: { in: [userId, recipientId] } } } }] }, select: { id: true } });
      if (existing) return existing;
      return tx.conversation.create({ data: { conversationType: "direct", createdByUserId: userId, participants: { create: [{ userId }, { userId: recipientId }] } }, select: { id: true } });
    });
  }
}
