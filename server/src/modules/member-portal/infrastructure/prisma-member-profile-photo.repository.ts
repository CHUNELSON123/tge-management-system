import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { MemberProfilePhoto, MemberProfilePhotoRepository } from "../domain/member-profile-photo.repository.js";

export class PrismaMemberProfilePhotoRepository implements MemberProfilePhotoRepository {
  constructor(private readonly database = prisma) {}

  async findByUserId(userId: string) {
    return this.database.memberProfilePhoto.findUnique({
      where: { userId },
      select: { contentType: true, data: true },
    });
  }

  async saveForUser(userId: string, photo: { contentType: string; data: Uint8Array }) {
    const data = new Uint8Array(photo.data);
    await this.database.$transaction(async (transaction) => {
      await transaction.memberProfilePhoto.upsert({
        where: { userId },
        create: { userId, contentType: photo.contentType, data },
        update: { contentType: photo.contentType, data },
      });
      await transaction.auditLog.create({
        data: { actorUserId: userId, action: "MEMBER_PROFILE_PHOTO_UPDATED", entityType: "User", entityId: userId },
      });
    });
  }
}
