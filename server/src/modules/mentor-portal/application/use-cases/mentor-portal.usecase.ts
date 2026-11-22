import type { MentorPortalRepository, MentorProfileUpdate } from "../../domain/repositories/mentor-portal.repository.js";
import type { MemberResourceFileStorage } from "../../../member-portal/domain/member-resources.repository.js";
export class MentorPortalUseCase {
  constructor(private readonly repository: MentorPortalRepository, private readonly storage?: MemberResourceFileStorage) {}
  profile(userId: string) { return this.repository.getProfile(userId); }
  updateProfile(userId: string, input: MentorProfileUpdate) { return this.repository.updateProfile(userId, input); }
  assignedWork(userId: string) { return this.repository.getAssignedWork(userId); }
  sessions(userId: string) { return this.repository.sessions(userId); }
  async resourceFile(userId: string, resourceId: string) {
    const record = await this.repository.findResourceFile(userId, resourceId);
    if (!record || !this.storage) return null;
    const file = await this.storage.open(record.storageKey);
    return { filename: record.originalFilename, mimeType: record.mimeType, ...file };
  }
}
