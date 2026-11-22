import { Router } from "express";
import { z } from "zod";
import type { GetPublicWebsiteEntriesUseCase } from "../application/get-public-website-entries.usecase.js";
export function createPublicWebsiteEntriesRouter(useCase: GetPublicWebsiteEntriesUseCase) {
  const router = Router();
  const kindSchema = z.enum(["blog", "testimonial", "faq"]);
  router.get("/website-content/:kind", async (req, res, next) => {
    const kind = kindSchema.safeParse(req.params.kind);
    if (!kind.success) { res.status(404).json({ message: "Content not found." }); return; }
    try { res.json({ data: await useCase.list(kind.data) }); } catch (error) { next(error); }
  });
  router.get("/website-content/:kind/:slug", async (req, res, next) => {
    const kind = kindSchema.safeParse(req.params.kind), slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(280).safeParse(req.params.slug);
    if (!kind.success || !slug.success) { res.status(404).json({ message: "Content not found." }); return; }
    try { const data = await useCase.get(kind.data, slug.data); if (!data) { res.status(404).json({ message: "Content not found." }); return; } res.json({ data }); } catch (error) { next(error); }
  });
  router.get("/website-media/:id", async (req, res, next) => {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) { res.status(404).json({ message: "Media not found." }); return; }
    try { const file = await useCase.media(id.data); if (!file) { res.status(404).json({ message: "Media not found." }); return; } res.type(file.contentType).setHeader("Cache-Control", "no-store").setHeader("X-Content-Type-Options", "nosniff").send(Buffer.from(file.data)); } catch (error) { next(error); }
  });
  return router;
}
