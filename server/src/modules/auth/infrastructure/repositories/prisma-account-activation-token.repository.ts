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

      await transaction.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          status: "ACTIVE",
          emailVerifiedAt: new Date(),
        },
      });
    });
  }
}
