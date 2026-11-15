export interface MemberProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  location: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  preferredLanguage: string | null;
  timezone: string | null;
  bio: string | null;
  businesses: Array<{ id: string; name: string; description: string | null; websiteUrl: string | null; email: string | null; phone: string | null; address: string | null }>;
  membership: {
    membershipNumber: string | null;
    joinedAt: string | null;
    status: string;
  } | null;
}

export class MemberProfileRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "MemberProfileRequestError";
  }
}

export type MemberProfileUpdate = Partial<Pick<MemberProfile, "firstName" | "lastName" | "phone" | "location" | "dateOfBirth" | "gender" | "nationality" | "preferredLanguage" | "timezone" | "bio">>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const memberProfileService = {
  async getProfile(accessToken: string, signal?: AbortSignal): Promise<MemberProfile> {
    const response = await fetch(`${API_URL}/api/member/profile`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal,
    });
    const body = await response.json().catch(() => null) as { message?: string; data?: MemberProfile } | null;
    if (!response.ok || !body?.data) {
      throw new MemberProfileRequestError(body?.message || "Member profile is temporarily unavailable.", response.status);
    }
    return body.data;
  },

  async updateProfile(accessToken: string, input: MemberProfileUpdate): Promise<MemberProfile> {
    const response = await fetch(`${API_URL}/api/member/profile`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await response.json().catch(() => null) as { message?: string; data?: MemberProfile } | null;
    if (!response.ok || !body?.data) {
      throw new MemberProfileRequestError(body?.message || "Profile details could not be saved right now.", response.status);
    }
    return body.data;
  },

  async getPhoto(accessToken: string, signal?: AbortSignal): Promise<Blob | null> {
    const response = await fetch(`${API_URL}/api/member/profile/photo`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal,
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new MemberProfileRequestError("Profile photo could not be loaded.", response.status);
    return response.blob();
  },

  async updatePhoto(accessToken: string, photo: File): Promise<void> {
    const response = await fetch(`${API_URL}/api/member/profile/photo`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": photo.type },
      body: photo,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { message?: string } | null;
      throw new MemberProfileRequestError(body?.message || "Profile photo could not be saved.", response.status);
    }
  },
};
