import type { ChatAttachmentsRepository } from "../domain/chat-attachments.repository.js";
export class ChatAttachmentsUseCase {
  constructor(private readonly repository: ChatAttachmentsRepository) {}
  upload(userId: string, conversationId: string, filename: string, bytes: Buffer) { return this.repository.upload(userId, conversationId, filename, "application/octet-stream", bytes); }
  download(userId: string, attachmentId: string) { return this.repository.download(userId, attachmentId); }
}
