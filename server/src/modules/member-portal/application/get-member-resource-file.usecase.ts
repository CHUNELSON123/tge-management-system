import type { MemberResourceFileContent, MemberResourceFileRecord, MemberResourceFileStorage, MemberResourcesRepository } from "../domain/member-resources.repository.js";
export interface MemberResourceDownload { filename: string; mimeType: string; content: AsyncIterable<Uint8Array>; fileSize: number }
export class GetMemberResourceFileUseCase {
  constructor(private readonly repository: MemberResourcesRepository, private readonly storage: MemberResourceFileStorage) {}
  async execute(userId: string, resourceId: string, now = new Date()): Promise<MemberResourceDownload | null> {
    const file: MemberResourceFileRecord | null = await this.repository.findFileForUser(userId, resourceId, now);
    if (!file) return null;
    const content: MemberResourceFileContent = await this.storage.open(file.storageKey);
    return { filename: file.originalFilename, mimeType: file.mimeType, content: content.content, fileSize: content.fileSize };
  }
}
