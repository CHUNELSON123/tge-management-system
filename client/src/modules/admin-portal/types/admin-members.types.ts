export type AdminMemberAccountStatus = "PENDING_ACTIVATION" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

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
  summary: { totalMembers: number; activeMembers: number; pendingApproval: number; inactiveMembers: number; alumni: number };
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

export type AdminMemberProfileUpdate = Pick<AdminMemberDetail, "firstName" | "lastName" | "phone" | "location" | "dateOfBirth" | "gender" | "nationality" | "preferredLanguage" | "timezone" | "bio">;
export type AdminDirectMemberInput = AdminMemberProfileUpdate & { email: string };

export interface AdminMembershipApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface AdminMembershipApplicationPage { rows: AdminMembershipApplication[]; total: number; page: number; pageSize: number }
