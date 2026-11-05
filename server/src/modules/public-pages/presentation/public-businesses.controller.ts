import { Router } from "express";
import { z } from "zod";
import type { GetPublicBusinessesUseCase, GetPublicBusinessCategoriesUseCase, GetPublicBusinessDetailsUseCase } from "../application/get-public-businesses.usecase.js";

export const publicBusinessQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  categoryId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(24).default(12),
}).strict();

export function createPublicBusinessesRouter(
  getBusinesses: GetPublicBusinessesUseCase,
  getCategories: GetPublicBusinessCategoriesUseCase,
  getDetails: GetPublicBusinessDetailsUseCase,
): Router {
  const router = Router();
  router.get("/businesses", async (req, res) => {
    const parsed = publicBusinessQuerySchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ message: "Invalid business search parameters." }); return; }
    try {
      const data = await getBusinesses.execute(parsed.data);
      res.status(200).json({ message: "Public businesses loaded.", data });
    } catch { res.status(503).json({ message: "Businesses are temporarily unavailable." }); }
  });
  router.get("/business-categories", async (_req, res) => {
    try {
      const data = await getCategories.execute();
      res.status(200).json({ message: "Public business categories loaded.", data });
    } catch { res.status(503).json({ message: "Business categories are temporarily unavailable." }); }
  });
  router.get("/businesses/:slug", async (req, res) => {
    const slug = req.params.slug;
    if (!slug || slug.length > 280) { res.status(404).json({ message: "Business not found." }); return; }
    try {
      const data = await getDetails.execute(slug);
      if (!data) { res.status(404).json({ message: "Business not found." }); return; }
      res.status(200).json({ message: "Public business loaded.", data });
    } catch { res.status(503).json({ message: "Business details are temporarily unavailable." }); }
  });
  return router;
}
