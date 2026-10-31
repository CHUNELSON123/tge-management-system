import { Router } from "express";
import { z, ZodError } from "zod";
import type { CreateAccountUseCase } from "../../application/use-cases/create-account.usecase.js";
import type { ResendAccountInvitationUseCase } from "../../application/use-cases/resend-account-invitation.usecase.js";
import { createAccountSchema } from "../dto/create-account.dto.js";
import {
  authenticate,
  type AuthenticatedRequest,
} from "../../../../common/middleware/authenticate.middleware.js";

const resendInvitationSchema = z.object({
  email: z.string().trim().email().max(254),
}).strict();

export function createAccountRouter(
  createAccount: CreateAccountUseCase,
  resendInvitation: ResendAccountInvitationUseCase,
): Router {
  const router = Router();

  router.post("/", authenticate, async (req: AuthenticatedRequest, res, next) => {
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
        message: "Account created. Activation invitation sent.",
        data: {
          userId: result.user.id,
          email: result.user.email,
          status: result.user.status,
          activationExpiresAt: result.activationExpiresAt,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid account data.", errors: error.issues });
        return;
      }
      if (error instanceof Error) {
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

  router.post("/resend-invitation", authenticate, async (req: AuthenticatedRequest, res, next) => {
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
