export type AdminMemberAccountStatus = "PENDING_ACTIVATION" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export interface AdminMembersFilter {
  search?: string;
  status?: string;
  programmeId?: string;
  cohortId?: string;
  page: number;
  pageSize: number;
}

export interface AdminMemberListRecord {
  id: string;
  membershipNumber: string | null;
  displayName: string;
  email: string;
  phone: string | null;
  status: string;
  joinedAt: string | null;
  programmes: Array<{ programmeId: string; programmeName: string; cohortId: string; cohortName: string }>;
  businesses: string[];
}

export interface AdminMembersPage {
  summary: {
    totalMembers: number;
    activeMembers: number;
    pendingApproval: number;
    inactiveMembers: number;
    alumni: number;
  };
  rows: AdminMemberListRecord[];
  total: number;
  page: number;
  pageSize: number;
  membershipStatuses: string[];
  programmes: Array<{ id: string; name: string; cohorts: Array<{ id: string; name: string }> }>;
}

export interface AdminMemberDetail {
  id: string;
  membershipNumber: string | null;
  membershipStatus: string;
  joinedAt: string | null;
  accountStatus: AdminMemberAccountStatus;
  emailVerifiedAt: string | null;
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
  businesses: Array<{ id: string; name: string; status: string; publicationStatus: string }>;
}

export interface AdminMemberEnrollment {
  id: string;
  programmeId: string;
  programmeName: string;
  cohortId: string;
  cohortName: string;
  cohortStartDate: string;
  cohortEndDate: string | null;
  enrollmentStatus: string;
  enrolledAt: string;
  completedAt: string | null;
}

export interface AdminMemberUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  location?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  preferredLanguage?: "en" | "fr" | null;
  timezone?: string | null;
  bio?: string | null;
}

export interface AdminDirectMemberInput extends AdminMemberUpdate {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
}

export interface AdminMemberOnboardingRecord {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AdminMembershipApplicationRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface AdminMembershipApplicationPage {
  rows: AdminMembershipApplicationRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminMembersRepository {
  list(filter: AdminMembersFilter): Promise<AdminMembersPage>;
  getDetail(memberId: string): Promise<AdminMemberDetail | null>;
  getProgrammes(memberId: string): Promise<AdminMemberEnrollment[] | null>;
  updateProfile(memberId: string, actorUserId: string, input: AdminMemberUpdate): Promise<AdminMemberDetail | null>;
  listPendingApplications(page: number, pageSize: number, search?: string): Promise<AdminMembershipApplicationPage>;
  directRegister(input: AdminDirectMemberInput, actorUserId: string, passwordHash: string): Promise<AdminMemberOnboardingRecord>;
  approveApplication(applicationId: string, actorUserId: string, passwordHash: string): Promise<AdminMemberOnboardingRecord>;
  rejectApplication(applicationId: string, actorUserId: string, reason: string): Promise<AdminMembershipApplicationRecord | null>;
  getProfilePhoto(memberId: string): Promise<{ contentType: string; data: Uint8Array } | null>;
  saveProfilePhoto(memberId: string, actorUserId: string, contentType: string, data: Uint8Array): Promise<boolean>;
}
