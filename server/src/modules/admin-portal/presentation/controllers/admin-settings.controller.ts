import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../../../../common/middleware/authenticate.middleware.js";
import { requirePermission } from "../../../../common/middleware/require-role.middleware.js";
import type { GetAdminSettingsUseCase } from "../../application/get-admin-settings.usecase.js";
import { organisationSettingsSchema } from "../../../system-settings/domain/organisation-settings.js";
export function createAdminSettingsRouter(useCase: GetAdminSettingsUseCase): Router {
  const router = Router();
  router.get("/settings", authenticate, async (req: AuthenticatedRequest, res, next) => {
    if (req.authenticatedUser?.roleName !== "Organisation Administrator") { next(); return; }
    try { res.json({ data: await useCase.execute(), canEdit: true }); } catch (error) { next(error); }
  }, requirePermission("system.manage"), async (_req, res, next) => {
    try { res.json({ data: await useCase.execute(), canEdit: true }); } catch (error) { next(error); }
  });
  router.put("/settings", authenticate, (req: AuthenticatedRequest, res, next) => {
    if (req.authenticatedUser?.roleName === "Organisation Administrator") { next(); return; }
    requirePermission("system.manage")(req, res, next);
  }, async (req: AuthenticatedRequest, res, next) => {
    const parsed = organisationSettingsSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Invalid settings.", errors: parsed.error.flatten() }); return; }
    try { res.json({ data: await useCase.save(parsed.data, req.authenticatedUser!.userId), canEdit: true }); } catch (error) { next(error); }
  });
  return router;
}
