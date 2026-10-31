import type { AccountActivationToken } from "../entities/account-activation-token.entity.js";

export interface AccountActivationTokenRepository {
  revokeActiveByUserId(userId: string): Promise<void>;

  create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<AccountActivationToken>;

  findValidByTokenHash(
    tokenHash: string,
  ): Promise<AccountActivationToken | null>;

  activateAccount(
    tokenId: string,
    userId: string,
    passwordHash: string,
  ): Promise<void>;
}
