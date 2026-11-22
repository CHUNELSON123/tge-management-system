import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../../../common/middleware/authenticate.middleware.js";
import { requirePermission } from "../../../../common/middleware/require-role.middleware.js";
import type { GetAdminAuditUseCase } from "../../application/get-admin-audit.usecase.js";

const querySchema = z.object({ dateFrom: z.string().datetime({ offset: true }).optional(), dateTo: z.string().datetime({ offset: true }).optional(), actorUserId: z.string().uuid().optional(), action: z.string().trim().max(150).optional(), entityType: z.string().trim().max(150).optional(), search: z.string().trim().max(150).optional(), page: z.coerce.number().int().min(1).max(1000).default(1), pageSize: z.coerce.number().int().min(1).max(50).default(10) }).superRefine((value, ctx) => {
  if (value.dateFrom && value.dateTo && new Date(value.dateFrom) > new Date(value.dateTo)) ctx.addIssue({ code: "custom", path: ["dateFrom"], message: "Start date must be before end date." });
  if (value.dateFrom && value.dateTo && new Date(value.dateTo).getTime() - new Date(value.dateFrom).getTime() > 90 * 86400000) ctx.addIssue({ code: "custom", path: ["dateTo"], message: "Choose a range of 90 days or less." });
});
export function createAdminAuditRouter(useCase: GetAdminAuditUseCase): Router {
  const router = Router();
  router.get("/audit-logs/actors", authenticate, requirePermission("audit.view"), async (_req, res, next) => { try { res.json({ message: "Audit actors loaded.", data: await useCase.actors() }); } catch (error) { next(error); } });
  router.get("/audit-logs", authenticate, requirePermission("audit.view"), async (req, res, next) => {
    const parsed = querySchema.safeParse(req.query); if (!parsed.success) { res.status(400).json({ message: "Audit filters are invalid.", issues: parsed.error.flatten() }); return; }
    const now = new Date(); const { dateFrom: from, dateTo: to, ...filters } = parsed.data;
    const dateFrom = from ? new Date(from) : new Date(now.getTime() - 30 * 86400000);
    const dateTo = to ? new Date(to) : now;
    if (dateTo < dateFrom || dateTo.getTime() - dateFrom.getTime() > 90 * 86400000) { res.status(400).json({ message: "Choose a valid audit date range of 90 days or less." }); return; }
    try { res.json({ message: "Audit logs loaded.", data: await useCase.list({ ...filters, dateFrom, dateTo }) }); } catch (error) { next(error); }
  });
  return router;
}
