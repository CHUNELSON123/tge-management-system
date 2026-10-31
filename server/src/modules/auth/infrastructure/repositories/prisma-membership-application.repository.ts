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
    return prisma.membershipApplication.create({
      data: application,
    });
  }
}
