import { prisma } from "../../../../infrastructure/database/prisma-client.js";
import type { MembershipApplication } from "../../domain/entities/membership-application.entity.js";
import type { MembershipApplicationRepository } from "../../domain/repositories/membership-application.repository.js";

export class PrismaMembershipApplicationRepository
  implements MembershipApplicationRepository
{
  async create(
    application: Omit<
      MembershipApplication,
      "id" | "status" | "rejectionReason" | "reviewedByUserId" |
      "reviewedAt" | "userId" | "createdAt" | "updatedAt"
    >,
  ): Promise<MembershipApplication> {
    return prisma.$transaction(async (tx) => {
      // Serialize requests for the same email without adding a parallel record or
      // disclosing whether that email already belongs to an application.
      const applicantEmail = application.applicantEmail.trim().toLowerCase();
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${applicantEmail}))`;
      const existing = await tx.membershipApplication.findFirst({
        where: { applicantEmail: { equals: applicantEmail, mode: "insensitive" } },
        orderBy: { createdAt: "desc" },
      });
      if (existing) return existing;
      return tx.membershipApplication.create({
        data: { ...application, applicantEmail },
      });
    });
  }
}
