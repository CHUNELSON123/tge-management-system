import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../../../../common/middleware/authenticate.middleware.js";
import { requirePermission } from "../../../../common/middleware/require-role.middleware.js";
import type { GetAdminDashboardUseCase } from "../../application/get-admin-dashboard.usecase.js";
import { adminDashboardQuerySchema } from "../dto/admin-dashboard.dto.js";

export function createAdminDashboardRouter(getDashboard: GetAdminDashboardUseCase): Router {
  const router = Router();
  router.get("/dashboard", authenticate, requirePermission("reports.view"), async (req: AuthenticatedRequest, res, next) => {
    const parsed = adminDashboardQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: "Choose a valid date range of up to 366 days." });
      return;
    }
    try {
      const from = new Date(`${parsed.data.from}T00:00:00.000Z`);
      const toExclusive = new Date(Date.parse(`${parsed.data.to}T00:00:00.000Z`) + 86_400_000);
      const data = await getDashboard.execute({ from, toExclusive });
      res.status(200).json({ message: "Admin dashboard loaded.", data });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
