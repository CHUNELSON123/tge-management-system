export interface MemberProfilePhoto { contentType: string; data: Uint8Array }
export interface MemberProfilePhotoRepository {
  findByUserId(userId: string): Promise<MemberProfilePhoto | null>;
  saveForUser(userId: string, photo: MemberProfilePhoto): Promise<void>;
}
