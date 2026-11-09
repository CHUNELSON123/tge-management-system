import type { MemberProfilePhoto, MemberProfilePhotoRepository } from "../domain/member-profile-photo.repository.js";

export class MemberProfilePhotoUseCase {
  constructor(private readonly repository: MemberProfilePhotoRepository) {}

  get(userId: string) {
    return this.repository.findByUserId(userId);
  }

  save(userId: string, photo: MemberProfilePhoto) {
    return this.repository.saveForUser(userId, photo);
  }
}
