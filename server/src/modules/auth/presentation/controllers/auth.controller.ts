import { Router } from "express";
import { ZodError } from "zod";
import type { LoginUseCase } from "../../application/use-cases/login.usecase.js";
import { loginSchema } from "../dto/login.dto.js";
import { authenticate, type AuthenticatedRequest } from "../../../../common/middleware/authenticate.middleware.js";
import type { Response } from "express";
import { prisma } from "../../../../infrastructure/database/prisma-client.js";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { z } from "zod";
import type { EmailService } from "../../../../common/services/email.service.js";

const passwordChangeSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(8).max(128) }).strict();
const recoveryRequestSchema = z.object({ email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()) }).strict();
const recoverySchema = z.object({ token: z.string().min(32).max(256), password: z.string().min(8).max(128) }).strict();

export function createAuthRouter(loginUseCase: LoginUseCase, emailService: EmailService): Router {
  const router = Router();

  router.get("/session", authenticate, (req: AuthenticatedRequest, res: Response) => {
    res.status(200).json({
      message: "Session is valid.",
      data: { userId: req.authenticatedUser!.userId, roleName: req.authenticatedUser!.roleName },
    });
  });

  router.post("/logout", authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const actor = req.authenticatedUser!;
      await prisma.revokedAccessToken.upsert({
        where: { tokenId: actor.tokenId },
        create: {
          userId: actor.userId,
          tokenId: actor.tokenId,
          expiresAt: actor.tokenExpiresAt,
        },
        update: {},
      });
      await prisma.auditLog.create({ data: { actorUserId: actor.userId, action: "AUTH_LOGOUT", entityType: "User", entityId: actor.userId } });
      res.status(200).json({ message: "Signed out successfully." });
    } catch (error) {
      next(error);
    }
  });

  router.post("/password/change", authenticate, async (req: AuthenticatedRequest, res, next) => {
    try {
      const input = passwordChangeSchema.parse(req.body);
      const actor = req.authenticatedUser!;
      const user = await prisma.user.findFirst({ where: { id: actor.userId, status: "ACTIVE", deletedAt: null }, select: { passwordHash: true } });
      if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
        res.status(400).json({ message: "Current password is incorrect." }); return;
      }
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await prisma.user.update({ where: { id: actor.userId }, data: { passwordHash } });
      await prisma.auditLog.create({ data: { actorUserId: actor.userId, action: "AUTH_PASSWORD_CHANGED", entityType: "User", entityId: actor.userId } });
      res.status(200).json({ message: "Password changed successfully." });
    } catch (error) { if (error instanceof ZodError) { res.status(400).json({ message: "Invalid password data." }); return; } next(error); }
  });

  router.post("/password/recovery", async (req, res, next) => {
    try {
      const { email } = recoveryRequestSchema.parse(req.body);
      const user = await prisma.user.findFirst({ where: { email, status: "ACTIVE", deletedAt: null }, select: { id: true, email: true, firstName: true } });
      if (user) {
        const token = randomBytes(32).toString("base64url");
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
        await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
        const resetUrl = new URL("/reset-password", process.env.CLIENT_URL || "http://localhost:3000");
        resetUrl.searchParams.set("token", token);
        await emailService.sendEmail({ to: user.email, subject: "Reset your TGE password", html: `<p>Hello ${user.firstName.replace(/[&<>"']/g, "")},</p><p><a href="${resetUrl.toString()}">Reset your password</a></p><p>This link expires in one hour and can only be used once.</p>` });
      }
      res.status(202).json({ message: "If an eligible account matches that email, password reset instructions will be sent." });
    } catch (error) { if (error instanceof ZodError) { res.status(400).json({ message: "Enter a valid email address." }); return; } next(error); }
  });

  router.post("/password/reset", async (req, res, next) => {
    try {
      const input = recoverySchema.parse(req.body);
      const tokenHash = createHash("sha256").update(input.token).digest("hex");
      const token = await prisma.passwordResetToken.findFirst({ where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() }, user: { status: "ACTIVE", deletedAt: null } }, select: { id: true, userId: true } });
      if (!token) { res.status(400).json({ message: "Reset link is invalid, expired, or already used." }); return; }
      const passwordHash = await bcrypt.hash(input.password, 12);
      await prisma.$transaction(async (tx) => {
        const claimed = await tx.passwordResetToken.updateMany({ where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
        if (claimed.count !== 1) throw new Error("RESET_TOKEN_INVALID");
        await tx.user.update({ where: { id: token.userId }, data: { passwordHash } });
      });
      await prisma.auditLog.create({ data: { actorUserId: token.userId, action: "AUTH_PASSWORD_RESET", entityType: "User", entityId: token.userId } });
      res.status(200).json({ message: "Password reset successfully." });
    } catch (error) { if (error instanceof ZodError || (error instanceof Error && error.message === "RESET_TOKEN_INVALID")) { res.status(400).json({ message: "Reset link is invalid, expired, or already used." }); return; } next(error); }
  });

  router.post("/login", async (req, res, next) => {
    try {
      const input = loginSchema.parse(req.body);
      const result = await loginUseCase.execute(input);
      const user = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } }).catch(() => null);
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => undefined);
        await prisma.auditLog.create({ data: { actorUserId: user.id, action: "AUTH_LOGIN_SUCCESS", entityType: "User", entityId: user.id } }).catch(() => undefined);
      }

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
        await prisma.auditLog.create({ data: { action: "AUTH_LOGIN_FAILURE", entityType: "Authentication", ipAddress: req.ip } }).catch(() => undefined);
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
