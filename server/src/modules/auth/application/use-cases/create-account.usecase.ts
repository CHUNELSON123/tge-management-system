import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import type { User } from "../../domain/entities/user.entity.js";
import { DuplicateAccountError } from "../../domain/entities/duplicate-account.error.js";
import type { UserRepository } from "../../domain/repositories/user.repository.js";
import type { CreateAccountActivationTokenUseCase } from "./create-account-activation-token.usecase.js";
import type { EmailService } from "../../../../common/services/email.service.js";

export interface CreateAccountInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  roleId: string;
}

export interface CreateAccountActor {
  roleName: string;
}

export interface CreateAccountResult {
  user: User;
  activationExpiresAt: Date;
}

const allowedRoles: Record<string, string[]> = {
  "System Administrator": [
    "System Administrator",
    "Organisation Administrator",
    "Member",
    "Mentor",
    "Trainer / Facilitator",
  ],
  "Organisation Administrator": [
    "Member",
    "Mentor",
    "Trainer / Facilitator",
  ],
};

export class CreateAccountUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly createActivationToken: CreateAccountActivationTokenUseCase,
    private readonly emailService: EmailService,
  ) {}

  async execute(
    input: CreateAccountInput,
    actor: CreateAccountActor,
  ): Promise<CreateAccountResult> {
    const permittedRoles = allowedRoles[actor.roleName];

    if (!permittedRoles) {
      throw new Error("ACCOUNT_CREATION_FORBIDDEN");
    }

    const email = input.email.trim().toLowerCase();

    if (await this.userRepository.findByEmail(email)) {
      throw new DuplicateAccountError(email);
    }

    const roleName = await this.userRepository.findRoleNameById(input.roleId);

    if (!roleName || !permittedRoles.includes(roleName)) {
      throw new Error("ROLE_ASSIGNMENT_FORBIDDEN");
    }

    const passwordHash = await bcrypt.hash(
      randomBytes(32).toString("hex"),
      12,
    );

    let user: User;

    try {
      user = await this.userRepository.create({
        roleId: input.roleId,
        email,
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone?.trim() || null,
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new DuplicateAccountError(email);
      }

      throw error;
    }

    const activation = await this.createActivationToken.execute(user.id);
    const activationBaseUrl = process.env.ACTIVATION_URL;

    if (!activationBaseUrl) {
      throw new Error("ACTIVATION_URL is not configured.");
    }

    const activationUrl = new URL(activationBaseUrl);
    activationUrl.searchParams.set("token", activation.token);

    await this.emailService.sendEmail({
      to: email,
      subject: "Activate your TGE account",
      html: `
        <h2>Welcome to TGE, ${user.firstName}!</h2>
        <p>An account has been created for you.</p>
        <p>Click the link below to activate your account and set your password.</p>
        <p><a href="${activationUrl.toString()}">Activate my account</a></p>
        <p>This link expires in 24 hours and can only be used once.</p>
        <p>If you did not expect this invitation, please ignore this email.</p>
      `,
    });

    return {
      user,
      activationExpiresAt: activation.expiresAt,
    };
  }
}