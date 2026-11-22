import type { MentorProfile, MentorWork, MentorSession } from "../entities/mentor-portal.entity.js";
export interface MentorProfileUpdate {
  firstName: string; lastName: string; phone: string | null; location: string | null; bio: string | null;
  expertise: string | null; professionalBackground: string | null; availability: string | null;
}
export interface MentorPortalRepository {
  getProfile(userId: string): Promise<MentorProfile | null>;
  updateProfile(userId: string, input: MentorProfileUpdate): Promise<MentorProfile | null>;
  getAssignedWork(userId: string): Promise<MentorWork | null>;
  findResourceFile(userId: string, resourceId: string): Promise<{ storageKey: string; originalFilename: string; mimeType: string } | null>;
  sessions(userId: string): Promise<MentorSession[]>;
}
