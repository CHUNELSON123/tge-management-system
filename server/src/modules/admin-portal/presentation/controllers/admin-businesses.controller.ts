import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../../../../common/middleware/authenticate.middleware.js";
import { requirePermission } from "../../../../common/middleware/require-role.middleware.js";
import type { ManageAdminBusinessesUseCase } from "../../application/manage-admin-businesses.usecase.js";
import { adminBusinessIdSchema, adminBusinessesQuerySchema, adminBusinessReviewSchema, adminBusinessUpdateSchema, adminBusinessWriteSchema } from "../dto/admin-businesses.dto.js";

export function createAdminBusinessesRouter(useCase: ManageAdminBusinessesUseCase): Router {
  const router = Router();
  const protect = [authenticate, requirePermission("businesses.manage")];
  router.get("/businesses", ...protect, async (req, res, next) => {
    const query = adminBusinessesQuerySchema.safeParse(req.query);
    if (!query.success) { res.status(400).json({ message: "Business filters are invalid." }); return; }
    try { res.json({ message: "Businesses loaded.", data: await useCase.list(query.data) }); } catch (error) { next(error); }
  });
  router.get("/businesses/categories", ...protect, async (_req, res, next) => {
    try { res.json({ message: "Business categories loaded.", data: await useCase.categories() }); } catch (error) { next(error); }
  });
  router.get("/businesses/owners", ...protect, async (_req, res, next) => {
    try { res.json({ message: "Business owners loaded.", data: await useCase.owners() }); } catch (error) { next(error); }
  });
  router.post("/businesses", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const input = adminBusinessWriteSchema.safeParse(req.body);
    const actor = req.authenticatedUser?.userId;
    if (!input.success) { res.status(400).json({ message: "Business details are invalid.", issues: input.error.flatten() }); return; }
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    try {
      const data = await useCase.create(actor, { ...input.data, description: input.data.description ?? null, address: input.data.address ?? null, websiteUrl: input.data.websiteUrl ?? null, email: input.data.email ?? null, phone: input.data.phone ?? null, categoryIds: [...new Set(input.data.categoryIds)] });
      res.status(201).json({ message: "Business created and queued for review.", data });
    } catch (error) {
      if (error instanceof Error && error.message === "BUSINESS_OWNER_OR_CATEGORY_INVALID") { res.status(400).json({ message: "Choose an active member and valid business categories." }); return; }
      next(error);
    }
  });
  router.get("/businesses/:businessId", ...protect, async (req, res, next) => {
    const id = adminBusinessIdSchema.safeParse(req.params.businessId);
    if (!id.success) { res.status(404).json({ message: "Business not found." }); return; }
    try {
      const data = await useCase.get(id.data);
      if (!data) { res.status(404).json({ message: "Business not found." }); return; }
      res.json({ message: "Business details loaded.", data });
    } catch (error) { next(error); }
  });
  router.post("/businesses/:businessId/review", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const id = adminBusinessIdSchema.safeParse(req.params.businessId);
    const input = adminBusinessReviewSchema.safeParse(req.body);
    const actor = req.authenticatedUser?.userId;
    if (!id.success) { res.status(404).json({ message: "Business not found." }); return; }
    if (!input.success) { res.status(400).json({ message: "Business decision is invalid.", issues: input.error.flatten() }); return; }
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    try {
      const data = await useCase.review(id.data, actor, { status: input.data.status, reason: input.data.reason?.trim() || null });
      if (!data) { res.status(404).json({ message: "Business not found." }); return; }
      res.json({ message: `Business ${input.data.status} recorded.`, data });
    } catch (error) {
      if (error instanceof Error && ["BUSINESS_REVIEW_TRANSITION_INVALID", "BUSINESS_REVIEW_STATE_CHANGED"].includes(error.message)) {
        res.status(409).json({ message: "That review decision is not allowed from the current business status." }); return;
      }
      next(error);
    }
  });
  router.patch("/businesses/:businessId", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const id = adminBusinessIdSchema.safeParse(req.params.businessId);
    const input = adminBusinessUpdateSchema.safeParse(req.body);
    const actor = req.authenticatedUser?.userId;
    if (!id.success) { res.status(404).json({ message: "Business not found." }); return; }
    if (!input.success) { res.status(400).json({ message: "Business details are invalid.", issues: input.error.flatten() }); return; }
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    try {
      const data = await useCase.update(id.data, actor, { ...input.data, description: input.data.description ?? null, address: input.data.address ?? null, websiteUrl: input.data.websiteUrl ?? null, email: input.data.email ?? null, phone: input.data.phone ?? null, categoryIds: [...new Set(input.data.categoryIds)] });
      if (!data) { res.status(404).json({ message: "Business not found." }); return; }
      res.json({ message: "Business updated and queued for review.", data });
    } catch (error) {
      if (error instanceof Error && error.message === "BUSINESS_CATEGORY_INVALID") { res.status(400).json({ message: "Choose valid business categories." }); return; }
      if (error instanceof Error && error.message === "BUSINESS_STATE_CHANGED") { res.status(409).json({ message: "This business changed while you were editing. Reload it before saving." }); return; }
      next(error);
    }
  });
  return router;
}
