import { Router } from "express";
import { ZodError } from "zod";
import type { LoginUseCase } from "../../application/use-cases/login.usecase.js";
import { loginSchema } from "../dto/login.dto.js";

export function createAuthRouter(loginUseCase: LoginUseCase): Router {
  const router = Router();

  router.post("/login", async (req, res, next) => {
    try {
      const input = loginSchema.parse(req.body);
      const result = await loginUseCase.execute(input);

      res.status(200).json({
        message: "Login successful.",
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Invalid login data.",
          errors: error.issues,
        });
        return;
      }

      if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
        res.status(401).json({
          message: "Invalid email or password.",
        });
        return;
      }

      next(error);
    }
  });

  return router;
}
