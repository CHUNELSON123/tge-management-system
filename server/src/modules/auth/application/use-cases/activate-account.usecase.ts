import { createHash } from "node:crypto";
import bcrypt from "bcrypt";
import type { AccountActivationTokenRepository } from "../../domain/repositories/account-activation-token.repository.js";

export class ActivateAccountUseCase {
  constructor(
    private readonly repository: AccountActivationTokenRepository,
  ) {}

  async execute(input: {
    token: string;
    password: string;
  }): Promise<void> {
    const tokenHash = createHash("sha256")
      .update(input.token)
      .digest("hex");

    const activationToken =
      await this.repository.findValidByTokenHash(tokenHash);

    if (!activationToken) {
      throw new Error("ACTIVATION_TOKEN_INVALID");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    await this.repository.activateAccount(
      activationToken.id,
      activationToken.userId,
      passwordHash,
    );
  }
}
