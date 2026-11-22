export interface ChatAttachmentsRepository {
  upload(userId: string, conversationId: string, filename: string, mimeType: string, bytes: Buffer): Promise<{ id: string } | null>;
  download(userId: string, attachmentId: string): Promise<{ originalFilename: string; bytes: Buffer } | null>;
}
