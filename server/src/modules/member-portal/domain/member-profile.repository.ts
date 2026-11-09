export interface MemberProfileUpdate {
  firstName?: string; lastName?: string; phone?: string | null; location?: string | null; dateOfBirth?: string | null;
  gender?: string | null; nationality?: string | null; preferredLanguage?: "en" | "fr" | null; timezone?: string | null; bio?: string | null;
}
export interface MemberProfileRecord {
  firstName: string; lastName: string; email: string; phone: string | null; location: string | null; dateOfBirth: string | null;
  gender: string | null; nationality: string | null; preferredLanguage: string | null; timezone: string | null; bio: string | null;
  businesses: Array<{ id: string; name: string; description: string | null; websiteUrl: string | null; email: string | null; phone: string | null; address: string | null }>;
  membership: { membershipNumber: string | null; joinedAt: string | null; status: string } | null;
}
export interface MemberProfileRepository {
  findByUserId(userId: string): Promise<MemberProfileRecord | null>;
  updateByUserId(userId: string, input: MemberProfileUpdate): Promise<MemberProfileRecord | null>;
}
