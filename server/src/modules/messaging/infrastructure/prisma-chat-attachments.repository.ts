import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { ChatAttachmentsRepository } from "../domain/chat-attachments.repository.js";

const root = () => resolve(process.env.CHAT_STORAGE_ROOT || "./storage/chat-attachments");
export class PrismaChatAttachmentsRepository implements ChatAttachmentsRepository {
  async upload(userId: string, conversationId: string, filename: string, mimeType: string, bytes: Buffer) {
    const member = await prisma.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } }, select: { user: { select: { firstName: true, lastName: true } } } });
    if (!member) return null;
    const key = randomUUID(); await mkdir(root(), { recursive: true }); await writeFile(join(root(), key), bytes, { flag: "wx" });
    try {
      return await prisma.$transaction(async (tx) => {
        const message = await tx.message.create({ data: { conversationId, senderUserId: userId, body: filename, messageType: "document", attachments: { create: { storageKey: key, originalFilename: filename, mimeType, fileSize: BigInt(bytes.length) } } }, select: { id: true } });
        const recipients = await tx.conversationParticipant.findMany({ where: { conversationId, userId: { not: userId } }, select: { userId: true } });
        if (recipients.length) await tx.notification.createMany({ data: recipients.map(({ userId: recipientId }) => ({ userId: recipientId, conversationId, title: "New document", body: `${member.user.firstName} ${member.user.lastName} shared ${filename}.`, notificationType: "message" })) });
        await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
        return message;
      });
    } catch (error) { await unlink(join(root(), key)).catch(() => {}); throw error; }
  }
  async download(userId: string, attachmentId: string) {
    const file = await prisma.messageAttachment.findFirst({ where: { id: attachmentId, message: { deletedAt: null, conversation: { participants: { some: { userId } } } } }, select: { storageKey: true, originalFilename: true, mimeType: true } });
    if (!file || !/^[0-9a-f-]{36}$/i.test(file.storageKey)) return null;
    return { ...file, bytes: await readFile(join(root(), file.storageKey)) };
  }
}
