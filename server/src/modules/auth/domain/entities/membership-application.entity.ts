export type MembershipApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface MembershipApplication {
  id: string;
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail: string;
  applicantPhone: string | null;
  applicantLocation?: string | null; applicantDateOfBirth?: Date | null; applicantGender?: string | null; applicantNationality?: string | null; applicantPreferredLanguage?: string | null; applicantTimezone?: string | null; applicantBio?: string | null;
  status: MembershipApplicationStatus;
  rejectionReason: string | null;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
