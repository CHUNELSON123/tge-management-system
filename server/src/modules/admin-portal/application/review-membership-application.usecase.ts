import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import type { EmailService } from "../../../common/services/email.service.js";
import type { AdminMemberOnboardingRecord, AdminMembersRepository, AdminMembershipApplicationRecord } from "../domain/admin-members.repository.js";
import type { CreateAccountActivationTokenUseCase } from "../../auth/application/use-cases/create-account-activation-token.usecase.js";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export class ReviewMembershipApplicationUseCase {
  constructor(
    private readonly repository: AdminMembersRepository,
    private readonly createActivationToken: CreateAccountActivationTokenUseCase,
    private readonly emailService: EmailService,
  ) {}

  async approve(applicationId: string, actorUserId: string): Promise<AdminMemberOnboardingRecord & { invitationSent: boolean }> {
    const activationBaseUrl = process.env.ACTIVATION_URL;
    if (!activationBaseUrl) throw new Error("ACTIVATION_URL is not configured.");
    const activationUrl = new URL(activationBaseUrl);
    const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
    const member = await this.repository.approveApplication(applicationId, actorUserId, passwordHash);
    try {
      const activation = await this.createActivationToken.execute(member.userId);
      activationUrl.searchParams.set("token", activation.token);
      await this.emailService.sendEmail({
      to: member.email,
      subject: "Your TGE membership application was approved",
      html: `<h2>Welcome to TGE, ${escapeHtml(member.firstName)}!</h2><p>Your membership application has been approved. Your membership is active, and your account is awaiting activation.</p><p>Use the link below to verify your email and set your password.</p><p><a href="${activationUrl.toString()}">Activate my account</a></p><p>This link expires in 24 hours and can only be used once.</p>`,
      });
      return { ...member, invitationSent: true };
    } catch { return { ...member, invitationSent: false }; }
  }

  async reject(applicationId: string, actorUserId: string, reason: string): Promise<AdminMembershipApplicationRecord & { notificationSent: boolean }> {
    const application = await this.repository.rejectApplication(applicationId, actorUserId, reason.trim());
    if (!application) throw new Error("APPLICATION_NOT_FOUND");
    try { await this.emailService.sendEmail({
      to: application.email,
      subject: "Update on your TGE membership application",
      html: `<h2>Membership application update for ${escapeHtml(application.firstName)}</h2><p>Your application was not approved at this time.</p><p>Reason: ${escapeHtml(reason.trim())}</p><p>You may submit a new application if you wish to reapply.</p>`,
    }); return { ...application, notificationSent: true }; }
    catch { return { ...application, notificationSent: false }; }
  }
}
