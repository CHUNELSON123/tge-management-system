import type { UserRepository } from "../../domain/repositories/user.repository.js";
import type { CreateAccountActivationTokenUseCase } from "./create-account-activation-token.usecase.js";
import type { EmailService } from "../../../../common/services/email.service.js";

export class ResendAccountInvitationUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly createActivationToken: CreateAccountActivationTokenUseCase,
    private readonly emailService: EmailService,
  ) {}

  async execute(
    emailInput: string,
    actorRole: string,
  ): Promise<{ email: string; activationExpiresAt: Date }> {
    if (!["System Administrator", "Organisation Administrator"].includes(actorRole)) {
      throw new Error("ACCOUNT_CREATION_FORBIDDEN");
    }

    const email = emailInput.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }

    if (user.status !== "PENDING_ACTIVATION") {
      throw new Error("ACCOUNT_NOT_PENDING_ACTIVATION");
    }

    const activation = await this.createActivationToken.execute(user.id);
    const activationBaseUrl = process.env.ACTIVATION_URL;

    if (!activationBaseUrl) {
      throw new Error("ACTIVATION_URL is not configured.");
    }

    const activationUrl = new URL(activationBaseUrl);
    activationUrl.searchParams.set("token", activation.token);

    const safeFirstName = user.firstName.replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character] ?? character);

    await this.emailService.sendEmail({
      to: email,
      subject: "Your TGE account activation invitation",
      html: `
        <h2>Welcome to TGE, ${safeFirstName}!</h2>
        <p>Your account is awaiting activation.</p>
        <p><a href="${activationUrl.toString()}">Activate your account</a></p>
        <p>This link expires in 24 hours and can only be used once.</p>
      `,
    });

    return {
      email,
      activationExpiresAt: activation.expiresAt,
    };
  }
}
