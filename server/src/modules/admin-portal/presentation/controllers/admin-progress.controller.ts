import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../../../../common/middleware/authenticate.middleware.js";
import { requirePermission } from "../../../../common/middleware/require-role.middleware.js";
import type { ManageAdminProgressUseCase } from "../../application/manage-admin-progress.usecase.js";

const idSchema = z.string().uuid();
const scopeSchema = z.enum(["programme", "cohort"]);
const policySchema = z.object({ attendanceMinimum: z.number().int().min(0).max(100).nullable(), deliverables: z.array(z.object({ id: idSchema, title: z.string().trim().min(1).max(200) }).strict()).max(50) }).strict().refine((value) => new Set(value.deliverables.map((item) => item.id)).size === value.deliverables.length);
const progressSchema = z.object({ attendanceAttended: z.number().int().min(0).max(10000).nullable(), attendanceTotal: z.number().int().min(0).max(10000).nullable(), completedDeliverables: z.array(idSchema).max(50) }).strict().refine((value) => (value.attendanceAttended === null && value.attendanceTotal === null) || (value.attendanceAttended !== null && value.attendanceTotal !== null && value.attendanceAttended <= value.attendanceTotal)).refine((value) => new Set(value.completedDeliverables).size === value.completedDeliverables.length);

export function createAdminProgressRouter(useCase: ManageAdminProgressUseCase) {
  const router = Router(); const protect = [authenticate, requirePermission("programmes.manage")];
  const errors: Record<string, string> = { PROGRESS_OWNER_ARCHIVED: "Requirements cannot be changed for an archived programme or cohort.", DELIVERABLE_ID_REUSED: "Remove the old deliverable and add a new one to change its meaning.", REQUIREMENTS_NOT_CONFIGURED: "Configure completion requirements before recording progress or changing a completion decision.", COMPLETION_NOT_RECORDED: "No completion decision has been recorded.", PROGRESS_WITHDRAWN: "Progress cannot be changed for a withdrawn enrollment.", PROGRESS_REQUIREMENTS_CHANGED: "The requirements changed. Refresh the page before saving progress." };
  const fail = (error: unknown, res: import("express").Response, next: import("express").NextFunction) => { if (error instanceof Error && errors[error.message]) { res.status(409).json({ message: errors[error.message] }); return; } next(error); };
  router.get("/progress/requirements/:scope/:id", ...protect, async (req, res, next) => {
    const scope = scopeSchema.safeParse(req.params.scope), id = idSchema.safeParse(req.params.id);
    if (!scope.success || !id.success) { res.status(400).json({ message: "Invalid requirements selection." }); return; }
    try { const data = await useCase.getPolicy(scope.data, id.data); if (!data) { res.status(404).json({ message: "Programme or cohort not found." }); return; } res.json({ message: "Requirements loaded.", data }); } catch (error) { next(error); }
  });
  router.put("/progress/requirements/:scope/:id", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const scope = scopeSchema.safeParse(req.params.scope), id = idSchema.safeParse(req.params.id), input = policySchema.safeParse(req.body);
    if (!scope.success || !id.success || !input.success) { res.status(400).json({ message: "Completion requirements are invalid." }); return; }
    try { const data = await useCase.savePolicy(scope.data, id.data, input.data, req.authenticatedUser!.userId); if (!data) { res.status(404).json({ message: "Programme or cohort not found." }); return; } res.json({ message: "Completion requirements saved.", data }); } catch (error) { fail(error, res, next); }
  });
  router.delete("/progress/requirements/cohort/:id", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const id = idSchema.safeParse(req.params.id); if (!id.success) { res.status(400).json({ message: "Invalid cohort." }); return; }
    try { if (!await useCase.removeOverride(id.data, req.authenticatedUser!.userId)) { res.status(404).json({ message: "Cohort not found." }); return; } res.json({ message: "Cohort now uses programme requirements.", data: { reset: true } }); } catch (error) { fail(error, res, next); }
  });
  router.get("/progress/enrollments/:id", ...protect, async (req, res, next) => {
    const id = idSchema.safeParse(req.params.id); if (!id.success) { res.status(400).json({ message: "Invalid enrollment." }); return; }
    try { const data = await useCase.getEnrollment(id.data); if (!data) { res.status(404).json({ message: "Enrollment not found." }); return; } res.json({ message: "Progress loaded.", data }); } catch (error) { next(error); }
  });
  router.put("/progress/enrollments/:id", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const id = idSchema.safeParse(req.params.id), input = progressSchema.safeParse(req.body); if (!id.success || !input.success) { res.status(400).json({ message: "Progress details are invalid." }); return; }
    try { const data = await useCase.saveEnrollment(id.data, input.data, req.authenticatedUser!.userId); if (!data) { res.status(404).json({ message: "Enrollment not found." }); return; } res.json({ message: "Progress saved.", data }); } catch (error) { fail(error, res, next); }
  });
  router.post("/progress/enrollments/:id/revoke-completion", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const id = idSchema.safeParse(req.params.id); if (!id.success) { res.status(400).json({ message: "Invalid enrollment." }); return; }
    try { const data = await useCase.revokeCompletion(id.data, req.authenticatedUser!.userId); if (!data) { res.status(404).json({ message: "Enrollment not found." }); return; } res.json({ message: "Completion decision removed; progress history is retained.", data }); } catch (error) { fail(error, res, next); }
  });
  return router;
}
