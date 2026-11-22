import { Router } from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../../../../infrastructure/database/prisma-client.js";

const inputSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  password: z.string().min(8).refine((value) => Buffer.byteLength(value, "utf8") <= 72),
  setupKey: z.string().min(1).max(256),
}).strict();

export function createFirstAdminRouter(database: typeof prisma = prisma): Router {
  const router = Router();
  router.post("/first-admin", async (req, res, next) => {
    const parsed = inputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Check your details. Passwords must be at least 8 characters and no more than 72 UTF-8 bytes." });
      return;
    }
    const configuredKey = process.env.FIRST_ADMIN_SETUP_KEY;
    if (!configuredKey || configuredKey.length < 32 || configuredKey.length > 256) {
      res.status(403).json({ message: "Administrator setup is unavailable." });
      return;
    }
    const digest = (value: string) => createHash("sha256").update(value).digest();
    if (!timingSafeEqual(digest(configuredKey), digest(parsed.data.setupKey))) {
      res.status(403).json({ message: "Administrator setup is unavailable or the setup key is incorrect." });
      return;
    }
    try {
      const passwordHash = await bcrypt.hash(parsed.data.password, 12);
      const result = await database.$transaction(async (tx) => {
        // All setup attempts serialize on the seeded role, including across server instances.
        const roles = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM roles WHERE name = 'System Administrator' FOR UPDATE`;
        if (!roles[0]) return "not-configured";
        const existing = await tx.user.findFirst({ where: { roleId: roles[0].id }, select: { id: true } });
        if (existing) return "closed";
        const adminCount = await tx.user.count({ where: { deletedAt: null, role: { name: { in: ["System Administrator", "Organisation Administrator"] } } } });
        if (adminCount >= 3) return "limit";
        const emailInUse = await tx.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
        if (emailInUse) return "email-in-use";
        const user = await tx.user.create({ data: {
          roleId: roles[0].id, email: parsed.data.email,
          firstName: parsed.data.firstName, lastName: parsed.data.lastName,
          passwordHash, status: "ACTIVE",
        } });
        await tx.auditLog.create({ data: { actorUserId: user.id, action: "FIRST_ADMIN_CREATED", entityType: "User", entityId: user.id } });
        return "created";
      });
      if (result === "not-configured") { res.status(503).json({ message: "Administrator roles have not been configured yet." }); return; }
      if (result === "closed") { res.status(409).json({ message: "First administrator setup has already been completed. Please sign in." }); return; }
      if (result === "limit") { res.status(409).json({ message: "The maximum of three administrators has been reached." }); return; }
      if (result === "email-in-use") { res.status(409).json({ message: "An account with this email already exists." }); return; }
      res.status(201).json({ message: "Administrator account created. You can now sign in." });
    } catch (error) { next(error); }
  });
  return router;
}
