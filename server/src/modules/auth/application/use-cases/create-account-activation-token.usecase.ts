import { createHash, randomBytes } from "node:crypto";
import type { AccountActivationTokenRepository } from "../../domain/repositories/account-activation-token.repository.js";

export class CreateAccountActivationTokenUseCase {
  constructor(
    private readonly repository: AccountActivationTokenRepository,
  ) {}

  async execute(userId: string): Promise<{ token: string; expiresAt: Date }> {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.repository.revokeActiveByUserId(userId);

    await this.repository.create({
      userId,
      tokenHash,
      expiresAt,
    });

    return { token, expiresAt };
  }
}
