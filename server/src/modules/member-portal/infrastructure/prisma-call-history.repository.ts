import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { MemberCallMedia } from "../domain/member-call-signaling.js";

export class PrismaCallHistoryRepository {
  async start(conversationId: string, callerId: string, callId: string, media: MemberCallMedia) {
    await prisma.message.create({ data: { id: callId, conversationId, senderUserId: callerId, body: media === "video" ? "Video call" : "Audio call", messageType: `call_ringing_${media}` } });
    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  }
  async answer(conversationId: string, callId: string, userId: string, media: MemberCallMedia) {
    await prisma.message.updateMany({ where: { id: callId, conversationId, senderUserId: { not: userId }, messageType: `call_ringing_${media}` }, data: { messageType: `call_active_${media}` } });
  }
  async finish(conversationId: string, callId: string, actorId: string | null, media: MemberCallMedia) {
    await prisma.$transaction(async (tx) => {
      const call = await tx.message.findFirst({ where: { id: callId, conversationId, messageType: { in: [`call_ringing_${media}`, `call_active_${media}`] } }, select: { senderUserId: true, messageType: true, sender: { select: { firstName: true, lastName: true } } } });
      if (!call) return;
      const missed = call.messageType.startsWith("call_ringing_") && (actorId === null || actorId === call.senderUserId);
      const declined = call.messageType.startsWith("call_ringing_") && !missed;
      const label = media === "video" ? "video" : "audio";
      const body = missed ? `Missed ${label} call` : declined ? `Declined ${label} call` : `${media === "video" ? "Video" : "Audio"} call ended`;
      const updated = await tx.message.updateMany({ where: { id: callId, messageType: call.messageType }, data: { body, messageType: `call_${missed ? "missed" : declined ? "declined" : "ended"}_${media}` } });
      if (!updated.count) return;
      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
      if (missed) {
        const recipients = await tx.conversationParticipant.findMany({ where: { conversationId, userId: { not: call.senderUserId } }, select: { userId: true } });
        if (recipients.length) await tx.notification.createMany({ data: recipients.map(({ userId }) => ({ userId, conversationId, notificationType: "missed_call", title: `Missed ${label} call`, body: `${call.sender.firstName} ${call.sender.lastName} called you.` })) });
      }
    });
  }
  async expire(conversationId?: string) {
    const calls = await prisma.message.findMany({ where: { ...(conversationId ? { conversationId } : {}), messageType: { in: ["call_ringing_audio", "call_ringing_video"] }, sentAt: { lt: new Date(Date.now() - 30_000) } }, select: { id: true, conversationId: true, messageType: true } });
    for (const call of calls) await this.finish(call.conversationId, call.id, null, call.messageType.endsWith("video") ? "video" : "audio");
  }
}
