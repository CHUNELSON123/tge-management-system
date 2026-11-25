import { Router } from "express";
import { z, ZodError } from "zod";
import type { CreateAccountUseCase } from "../../application/use-cases/create-account.usecase.js";
import type { ResendAccountInvitationUseCase } from "../../application/use-cases/resend-account-invitation.usecase.js";
import { createAccountSchema } from "../dto/create-account.dto.js";
import {
  authenticate,
  type AuthenticatedRequest,
} from "../../../../common/middleware/authenticate.middleware.js";
import { requirePermission } from "../../../../common/middleware/require-role.middleware.js";
import { prisma } from "../../../../infrastructure/database/prisma-client.js";
import type { CreateAccountActivationTokenUseCase } from "../../application/use-cases/create-account-activation-token.usecase.js";

const resendInvitationSchema = z.object({
  email: z.string().trim().email().max(254),
}).strict();

export function createAccountRouter(
  createAccount: CreateAccountUseCase,
  resendInvitation: ResendAccountInvitationUseCase,
  createActivationToken: CreateAccountActivationTokenUseCase,
): Router {
  const router = Router();

  router.post("/manual-activation-link", authenticate, requirePermission("users.manage"), async (req: AuthenticatedRequest, res, next) => {
    try {
      const { email } = resendInvitationSchema.parse(req.body);
      const actor = req.authenticatedUser;
      if (!actor || !["System Administrator", "Organisation Administrator"].includes(actor.roleName)) {
        res.status(403).json({ message: "You are not authorized to create activation links." }); return;
      }
      const user = await prisma.user.findFirst({ where: { email: email.toLowerCase(), deletedAt: null }, select: { id: true, status: true, role: { select: { name: true } } } });
      if (!user || !["Member", "Mentor"].includes(user.role.name)) { res.status(404).json({ message: "Member or mentor account not found." }); return; }
      if (user.status !== "PENDING_ACTIVATION") { res.status(409).json({ message: "This account is not awaiting activation." }); return; }
      const base = process.env.ACTIVATION_URL;
      if (!base) throw new Error("ACTIVATION_URL is not configured.");
      const url = new URL(base);
      const activation = await createActivationToken.execute(user.id, false);
      url.searchParams.set("token", activation.token);
      await prisma.auditLog.create({ data: { actorUserId: actor.userId, action: "MANUAL_ACTIVATION_LINK_CREATED", entityType: "User", entityId: user.id } });
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json({ message: "Activation link created.", data: { activationUrl: url.toString(), expiresAt: activation.expiresAt } });
    } catch (error) {
      if (error instanceof ZodError) { res.status(400).json({ message: "Invalid email address." }); return; }
      next(error);
    }
  });

  router.post("/", authenticate, requirePermission("users.manage"), async (req: AuthenticatedRequest, res, next) => {
    try {
      const input = createAccountSchema.parse(req.body);
      const actor = req.authenticatedUser;

      if (!actor) {
        res.status(401).json({ message: "Authentication required." });
        return;
      }

      const result = await createAccount.execute(input, {
        roleName: actor.roleName,
      });

      res.status(201).json({
        message: result.invitationSent ? "Account created. Activation invitation sent." : "Account created, but the invitation could not be sent. Resend it from Users & Roles.",
        data: {
          userId: result.user.id,
          email: result.user.email,
          status: result.user.status,
          activationExpiresAt: result.activationExpiresAt,
          invitationSent: result.invitationSent,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid account data.", errors: error.issues });
        return;
      }
      if (error instanceof Error) {
        if (error.message === "ADMIN_LIMIT_REACHED") {
          res.status(409).json({ message: "The maximum of three administrators has been reached." });
          return;
        }
        if (error.name === "DuplicateAccountError") {
          res.status(409).json({ message: "An account with this email already exists." });
          return;
        }
        if (["ACCOUNT_CREATION_FORBIDDEN", "ROLE_ASSIGNMENT_FORBIDDEN"].includes(error.message)) {
          res.status(403).json({ message: "You are not authorized to assign this role." });
          return;
        }
      }
      next(error);
    }
  });

  router.post("/resend-invitation", authenticate, requirePermission("users.manage"), async (req: AuthenticatedRequest, res, next) => {
    try {
      const { email } = resendInvitationSchema.parse(req.body);
      const actor = req.authenticatedUser;

      if (!actor) {
        res.status(401).json({ message: "Authentication required." });
        return;
      }

      const result = await resendInvitation.execute(email, actor.roleName);

      res.status(200).json({
        message: "Activation invitation sent successfully.",
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid email address.", errors: error.issues });
        return;
      }
      if (error instanceof Error) {
        if (error.message === "ACCOUNT_CREATION_FORBIDDEN") {
          res.status(403).json({ message: "You are not authorized to resend invitations." });
          return;
        }
        if (error.message === "ACCOUNT_NOT_FOUND") {
          res.status(404).json({ message: "Account not found." });
          return;
        }
        if (error.message === "ACCOUNT_NOT_PENDING_ACTIVATION") {
          res.status(409).json({ message: "This account is not awaiting activation." });
          return;
        }
      }
      next(error);
    }
  });

  return router;
}
