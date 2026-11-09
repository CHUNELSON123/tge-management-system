import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { MemberConversationDetail, MemberConversationMessage, MemberConversationSummary, MemberMessagesRepository } from "../domain/member-messages.repository.js";

export class PrismaMemberMessagesRepository implements MemberMessagesRepository {
  constructor(private readonly database = prisma) {}
  async listConversations(userId: string): Promise<MemberConversationSummary[]> {
    const memberships = await this.database.conversationParticipant.findMany({
      where: { userId }, orderBy: { conversation: { updatedAt: "desc" } },
      select: { lastReadAt: true, conversation: { select: {
        id: true, title: true, conversationType: true, updatedAt: true,
        participants: { where: { userId: { not: userId } }, select: { user: { select: { firstName: true, lastName: true } } } },
        messages: { where: { deletedAt: null }, orderBy: [{ sentAt: "desc" }, { id: "desc" }], take: 1, select: { body: true, sentAt: true, senderUserId: true } },
      } } },
    });
    return Promise.all(memberships.map(async (membership) => {
      const conv = membership.conversation;
      const unreadCount = await this.database.message.count({ where: {
        conversationId: conv.id, deletedAt: null, senderUserId: { not: userId },
        ...(membership.lastReadAt ? { sentAt: { gt: membership.lastReadAt } } : {}),
      } });
      const latest = conv.messages[0];
      return {
        id: conv.id, title: conv.title, conversationType: conv.conversationType,
        participantNames: conv.participants.map(({ user }) => [user.firstName, user.lastName].filter(Boolean).join(" ")),
        lastMessage: latest ? { body: latest.body, sentAt: latest.sentAt.toISOString(), senderUserId: latest.senderUserId } : null,
        unreadCount,
      };
    }));
  }
  async readConversation(userId: string, conversationId: string, now: Date): Promise<MemberConversationDetail | null> {
    const membership = await this.database.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } }, select: { conversationId: true } });
    if (!membership) return null;
    const conversation = await this.database.conversation.findUnique({ where: { id: conversationId }, select: {
      id: true, title: true, conversationType: true,
      participants: { where: { userId: { not: userId } }, select: { userId: true, user: { select: { firstName: true, lastName: true } } } },
      messages: { where: { deletedAt: null }, orderBy: [{ sentAt: "desc" }, { id: "desc" }], take: 100, select: { id: true, senderUserId: true, body: true, sentAt: true, sender: { select: { firstName: true, lastName: true } } } },
    } });
    if (!conversation) return null;
    await this.database.conversationParticipant.update({ where: { conversationId_userId: { conversationId, userId } }, data: { lastReadAt: now } });
    return {
      conversationId: conversation.id, title: conversation.title, conversationType: conversation.conversationType,
      peerUserId: conversation.participants.length === 1 ? conversation.participants[0].userId : null,
      participantNames: conversation.participants.map(({ user }) => [user.firstName, user.lastName].filter(Boolean).join(" ")),
      messages: conversation.messages.reverse().map((message) => ({
        id: message.id, senderUserId: message.senderUserId,
        senderName: [message.sender.firstName, message.sender.lastName].filter(Boolean).join(" "),
        body: message.body, sentAt: message.sentAt.toISOString(), isOwn: message.senderUserId === userId,
      })),
    };
  }
  async sendMessage(userId: string, conversationId: string, body: string, now: Date): Promise<MemberConversationMessage | null> {
    return this.database.$transaction(async (tx) => {
      const membership = await tx.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } }, select: { user: { select: { firstName: true, lastName: true } } } });
      if (!membership) return null;
      const message = await tx.message.create({ data: { conversationId, senderUserId: userId, body, messageType: "text" }, select: { id: true, senderUserId: true, body: true, sentAt: true } });
      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: now } });
      return { id: message.id, senderUserId: message.senderUserId, senderName: [membership.user.firstName, membership.user.lastName].filter(Boolean).join(" "), body: message.body, sentAt: message.sentAt.toISOString(), isOwn: true };
    });
  }
  async findCallPeer(userId: string, conversationId: string): Promise<string | null> {
    const membership = await this.database.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } }, select: { conversation: { select: { participants: { select: { userId: true } } } } } });
    if (!membership || membership.conversation.participants.length !== 2) return null;
    return membership.conversation.participants.find((participant) => participant.userId !== userId)?.userId ?? null;
  }
}
