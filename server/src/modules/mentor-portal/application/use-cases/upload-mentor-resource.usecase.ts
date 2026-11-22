import { randomUUID } from "node:crypto";
import type { MentorResourcesRepository, MentorUploadStorage } from "../../domain/repositories/mentor-resources.repository.js";
export class UploadMentorResourceUseCase {
  constructor(private readonly repository: MentorResourcesRepository, private readonly storage: MentorUploadStorage) {}
  categories() { return this.repository.categories(); }
  async execute(userId: string, input: { title: string; categoryId: string; targetType: "programme" | "cohort"; targetId: string; filename: string; mimeType: string; content: Uint8Array }) {
    const id = randomUUID(); const storageKey = await this.storage.store(id, input.filename, input.content);
    try { const result = await this.repository.create(userId, { ...input, id, storageKey, fileSize: input.content.byteLength }); if (!result) throw new Error("RESOURCE_TARGET_INVALID"); return result; }
    catch (error) { await this.storage.remove(storageKey).catch(() => undefined); throw error; }
  }
}
