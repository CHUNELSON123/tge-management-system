import type { MembershipApplication } from "../entities/membership-application.entity.js";

export interface MembershipApplicationRepository {
  create(
    application: Omit<
      MembershipApplication,
      "id" | "status" | "rejectionReason" | "reviewedByUserId" |
      "reviewedAt" | "userId" | "createdAt" | "updatedAt"
    >,
  ): Promise<MembershipApplication>;
}
