import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../../../../common/middleware/authenticate.middleware.js";
import { requirePermission } from "../../../../common/middleware/require-role.middleware.js";
import type { GetAdminReportsUseCase } from "../../application/get-admin-reports.usecase.js";
import { adminDashboardQuerySchema } from "../dto/admin-dashboard.dto.js";
export function createAdminReportsRouter(useCase: GetAdminReportsUseCase): Router {
  const router = Router();
  router.get("/reports/export", authenticate, requirePermission("reports.view"), async (req: AuthenticatedRequest, res, next) => {
    const parsed = adminDashboardQuerySchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ message: "Report date range is invalid." }); return; }
    const from = new Date(`${parsed.data.from}T00:00:00.000Z`);
    const toExclusive = new Date(Date.parse(`${parsed.data.to}T00:00:00.000Z`) + 86_400_000);
    try {
      const csv = await useCase.export({ from, toExclusive }, req.authenticatedUser!.userId);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="tge-report-${parsed.data.from}-${parsed.data.to}.csv"`);
      res.send(csv);
    } catch (error) { next(error); }
  });
  router.get("/reports", authenticate, requirePermission("reports.view"), async (req, res, next) => {
    const parsed = adminDashboardQuerySchema.safeParse(req.query); if (!parsed.success) { res.status(400).json({ message: "Report date range is invalid. Use UTC calendar dates within a 366-day period." }); return; }
    const from = new Date(`${parsed.data.from}T00:00:00.000Z`); const toExclusive = new Date(`${parsed.data.to}T00:00:00.000Z`); toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
    try { res.json({ message: "Operational reports loaded.", data: await useCase.execute({ from, toExclusive }) }); } catch (error) { next(error); }
  });
  return router;
}
