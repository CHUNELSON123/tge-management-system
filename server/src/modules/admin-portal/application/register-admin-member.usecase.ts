import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import type { EmailService } from "../../../common/services/email.service.js";
import type { AdminDirectMemberInput, AdminMemberOnboardingRecord, AdminMembersRepository } from "../domain/admin-members.repository.js";
import type { CreateAccountActivationTokenUseCase } from "../../auth/application/use-cases/create-account-activation-token.usecase.js";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export class RegisterAdminMemberUseCase {
  constructor(
    private readonly repository: AdminMembersRepository,
    private readonly createActivationToken: CreateAccountActivationTokenUseCase,
    private readonly emailService: EmailService,
  ) {}

  async execute(input: AdminDirectMemberInput, actorUserId: string): Promise<AdminMemberOnboardingRecord & { invitationSent: boolean }> {
    const activationBaseUrl = process.env.ACTIVATION_URL;
    if (!activationBaseUrl) throw new Error("ACTIVATION_URL is not configured.");
    const activationUrl = new URL(activationBaseUrl);
    const email = input.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
    const member = await this.repository.directRegister({ ...input, email }, actorUserId, passwordHash);
    try {
      const activation = await this.createActivationToken.execute(member.userId);
      activationUrl.searchParams.set("token", activation.token);
      await this.emailService.sendEmail({
      to: member.email,
      subject: "Activate your TGE member account",
      html: `<h2>Welcome to TGE, ${escapeHtml(member.firstName)}!</h2><p>Your TGE membership is active. Your account is awaiting activation.</p><p>Use the link below to verify your email and set your password.</p><p><a href="${activationUrl.toString()}">Activate my account</a></p><p>This link expires in 24 hours and can only be used once.</p>`,
      });
      return { ...member, invitationSent: true };
    } catch {
      return { ...member, invitationSent: false };
    }
  }
}
