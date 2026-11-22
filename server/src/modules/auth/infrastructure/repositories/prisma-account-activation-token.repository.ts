import { prisma } from "../../../../infrastructure/database/prisma-client.js";
import type { AccountActivationToken } from "../../domain/entities/account-activation-token.entity.js";
import type { AccountActivationTokenRepository } from "../../domain/repositories/account-activation-token.repository.js";

export class PrismaAccountActivationTokenRepository
  implements AccountActivationTokenRepository
{
  async revokeActiveByUserId(userId: string): Promise<void> {
    await prisma.accountActivationToken.updateMany({
      where: { userId, usedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<AccountActivationToken> {
    return prisma.accountActivationToken.create({ data });
  }

  async findValidByTokenHash(
    tokenHash: string,
  ): Promise<AccountActivationToken | null> {
    return prisma.accountActivationToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async activateAccount(
    tokenId: string,
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      const result = await transaction.accountActivationToken.updateMany({
        where: {
          id: tokenId,
          userId,
          usedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });

      if (result.count !== 1) {
        throw new Error("ACTIVATION_TOKEN_INVALID");
      }

      const updated = await transaction.user.updateMany({
        where: { id: userId, status: "PENDING_ACTIVATION", deletedAt: null },
        data: {
          passwordHash,
          status: "ACTIVE",
          emailVerifiedAt: new Date(),
        },
      });
      if (updated.count !== 1) throw new Error("ACTIVATION_TOKEN_INVALID");

      const user = await transaction.user.findUniqueOrThrow({
        where: { id: userId },
        select: { role: { select: { name: true } } },
      });
      if (user.role.name === "Member") await transaction.member.upsert({ where: { userId }, create: { userId, membershipStatus: "active", joinedAt: new Date() }, update: {} });
      if (user.role.name === "Mentor") await transaction.mentor.upsert({ where: { userId }, create: { userId, status: "active" }, update: {} });
    });
  }
}
