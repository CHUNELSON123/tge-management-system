import { Router } from "express";
import { ZodError } from "zod";
import type { CreateMembershipApplicationUseCase } from "../../application/use-cases/create-membership-application.usecase.js";
import type { ActivateAccountUseCase } from "../../application/use-cases/activate-account.usecase.js";
import { createMembershipApplicationSchema } from "../dto/create-membership-application.dto.js";
import { activateAccountSchema } from "../dto/activate-account.dto.js";

export function createMembershipApplicationRouter(
  createApplication: CreateMembershipApplicationUseCase,
  activateAccount: ActivateAccountUseCase,
): Router {
  const router = Router();

  router.post("/", async (req, res, next) => {
    try {
      const input = createMembershipApplicationSchema.parse(req.body);
      const application = await createApplication.execute(input);

      res.status(201).json({
        message: "Membership application submitted successfully.",
        data: application,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Invalid membership application data.",
          errors: error.issues,
        });
        return;
      }
      next(error);
    }
  });

  router.post("/activate", async (req, res, next) => {
    try {
      const input = activateAccountSchema.parse(req.body);
      await activateAccount.execute(input);

      res.status(200).json({
        message: "Account activated successfully.",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Invalid activation data.",
          errors: error.issues,
        });
        return;
      }

      if (
        error instanceof Error &&
        error.message === "ACTIVATION_TOKEN_INVALID"
      ) {
        res.status(400).json({
          message: "Activation link is invalid, expired, or already used.",
        });
        return;
      }

      next(error);
    }
  });

  return router;
}
