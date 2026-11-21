import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { MemberConversationDetail, MemberConversationMessage, MemberConversationSummary, MemberMessagesRepository } from "../domain/member-messages.repository.js";

export class PrismaMemberMessagesRepository implements MemberMessagesRepository {
  constructor(private readonly database = prisma) {}
  async listConversations(userId: string): Promise<MemberConversationSummary[]> {
    const memberships = await this.database.conversationParticipant.findMany({
      where: { userId }, orderBy: { conversation: { updatedAt: "desc" } },
      select: { lastReadAt: true, conversation: { select: {
        id: true, title: true, conversationType: true, updatedAt: true,
        participants: { where: { userId: { not: userId } }, select: { user: { select: { firstName: true, lastName: true, role: { select: { name: true } } } } } },
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
        participantRoles: conv.participants.map(({ user }) => user.role.name),
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
      messages: { where: { deletedAt: null }, orderBy: [{ sentAt: "desc" }, { id: "desc" }], take: 100, select: { id: true, senderUserId: true, body: true, sentAt: true, messageType: true, attachments: { select: { id: true, originalFilename: true, fileSize: true } }, sender: { select: { firstName: true, lastName: true } } } },
    } });
    if (!conversation) return null;
    return {
      conversationId: conversation.id, title: conversation.title, conversationType: conversation.conversationType,
      peerUserId: conversation.participants.length === 1 ? conversation.participants[0].userId : null,
      participantNames: conversation.participants.map(({ user }) => [user.firstName, user.lastName].filter(Boolean).join(" ")),
      messages: conversation.messages.reverse().map((message) => ({
        id: message.id, senderUserId: message.senderUserId,
        senderName: [message.sender.firstName, message.sender.lastName].filter(Boolean).join(" "),
        body: message.body, sentAt: message.sentAt.toISOString(), isOwn: message.senderUserId === userId, messageType: message.messageType, attachments: message.attachments.map((attachment) => ({ id: attachment.id, filename: attachment.originalFilename, size: Number(attachment.fileSize) })),
      })),
    };
  }
  async markReadThrough(userId: string, conversationId: string, messageId: string): Promise<boolean> {
    const message = await this.database.message.findFirst({ where: { id: messageId, conversationId, deletedAt: null, conversation: { participants: { some: { userId } } } }, select: { sentAt: true } });
    if (!message) return false;
    await this.database.conversationParticipant.updateMany({ where: { conversationId, userId, OR: [{ lastReadAt: null }, { lastReadAt: { lt: message.sentAt } }] }, data: { lastReadAt: message.sentAt } });
    return true;
  }
  async sendMessage(userId: string, conversationId: string, body: string, now: Date): Promise<MemberConversationMessage | null> {
    return this.database.$transaction(async (tx) => {
      const membership = await tx.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } }, select: { user: { select: { firstName: true, lastName: true } } } });
      if (!membership) return null;
      const message = await tx.message.create({ data: { conversationId, senderUserId: userId, body, messageType: "text" }, select: { id: true, senderUserId: true, body: true, sentAt: true } });
      const recipients = await tx.conversationParticipant.findMany({ where: { conversationId, userId: { not: userId } }, select: { userId: true } });
      if (recipients.length) await tx.notification.createMany({ data: recipients.map(({ userId: recipientId }) => ({ userId: recipientId, title: "New message", body: `${[membership.user.firstName, membership.user.lastName].filter(Boolean).join(" ")}: ${body}`, notificationType: "message", conversationId })) });
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
