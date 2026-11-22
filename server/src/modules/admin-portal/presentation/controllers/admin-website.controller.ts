import { Router, raw } from "express";
import { authenticate, type AuthenticatedRequest } from "../../../../common/middleware/authenticate.middleware.js";
import { requirePermission } from "../../../../common/middleware/require-role.middleware.js";
import type { ManageAdminWebsiteUseCase } from "../../application/manage-admin-website.usecase.js";
import { websiteContentQuerySchema, websiteEntryWriteSchema, websiteIdSchema, websiteNewsWriteSchema, websitePageWriteSchema, websiteTransitionSchema } from "../dto/admin-website.dto.js";
import { z } from "zod";
import { WebsiteSettingsRepository, websiteSettingsSchema } from "../../../public-pages/infrastructure/website-settings.repository.js";

function conflict(error: unknown) { return typeof error === "object" && error !== null && "code" in error && error.code === "P2002"; }
function statusError(error: unknown) { return error instanceof Error && ["WEBSITE_TRANSITION_INVALID", "WEBSITE_CONTENT_CHANGED"].includes(error.message); }
export function createAdminWebsiteRouter(useCase: ManageAdminWebsiteUseCase): Router {
  const router = Router(); const protect = [authenticate, requirePermission("website.manage")];
  const settings = new WebsiteSettingsRepository();
  router.get("/website/settings", ...protect, async (_req, res, next) => {
    try { res.json({ data: await settings.get() }); } catch (error) { next(error); }
  });
  router.put("/website/settings", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const parsed = websiteSettingsSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: "Check the email addresses and use HTTPS for social media links." }); return; }
    try { res.json({ data: await settings.save(parsed.data, req.authenticatedUser!.userId) }); } catch (error) { next(error); }
  });
  router.get("/website/content", ...protect, async (req, res, next) => {
    const query = websiteContentQuerySchema.safeParse(req.query); if (!query.success) { res.status(400).json({ message: "Website content filters are invalid." }); return; }
    try { res.json({ message: "Website content loaded.", data: await useCase.list(query.data) }); } catch (error) { next(error); }
  });
  const entryType = z.enum(["blog", "testimonial", "faq"]);
  router.get("/website/entries/:type/:id", ...protect, async (req, res, next) => {
    const type = entryType.safeParse(req.params.type), id = websiteIdSchema.safeParse(req.params.id);
    if (!type.success || !id.success) { res.status(404).json({ message: "Content not found." }); return; }
    try { const data = await useCase.get(type.data, id.data); if (!data) { res.status(404).json({ message: "Content not found." }); return; } res.json({ data }); } catch (error) { next(error); }
  });
  router.post("/website/entries/:type", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const type = entryType.safeParse(req.params.type), input = websiteEntryWriteSchema.safeParse(req.body);
    if (!type.success || !input.success) { res.status(400).json({ message: "Content details are invalid." }); return; }
    try { res.status(201).json({ data: await useCase.createEntry(type.data, input.data, req.authenticatedUser!.userId) }); } catch (error) { if (conflict(error)) { res.status(409).json({ message: "This slug is already in use for this content type." }); return; } next(error); }
  });
  router.patch("/website/entries/:type/:id", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const type = entryType.safeParse(req.params.type), id = websiteIdSchema.safeParse(req.params.id), input = websiteEntryWriteSchema.safeParse(req.body);
    if (!type.success || !id.success || !input.success) { res.status(400).json({ message: "Content details are invalid." }); return; }
    try { const data = await useCase.updateEntry(type.data, id.data, input.data, req.authenticatedUser!.userId); if (!data) { res.status(404).json({ message: "Content not found." }); return; } res.json({ data }); } catch (error) { if (conflict(error) || statusError(error)) { res.status(409).json({ message: "Content changed or the slug is already in use." }); return; } next(error); }
  });
  router.post("/website/entries/:type/:id/status", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const type = entryType.safeParse(req.params.type), id = websiteIdSchema.safeParse(req.params.id), input = websiteTransitionSchema.safeParse(req.body);
    if (!type.success || !id.success || !input.success) { res.status(400).json({ message: "Content status is invalid." }); return; }
    try { const data = await useCase.transition(type.data, id.data, input.data.status, req.authenticatedUser!.userId); if (!data) { res.status(404).json({ message: "Content not found." }); return; } res.json({ data }); } catch (error) { if (statusError(error)) { res.status(409).json({ message: "This status change is not allowed. Refresh and try again." }); return; } next(error); }
  });
  router.post("/website/media", ...protect, raw({ type: ["image/png", "image/jpeg", "image/webp"], limit: "3mb" }), async (req: AuthenticatedRequest, res, next) => {
    const data = req.body, mime = req.get("content-type")?.split(";")[0] || "";
    let title = ""; try { title = decodeURIComponent(req.get("x-file-name") || "").replace(/[\r\n\0]/g, "").trim().slice(0, 250); } catch { title = ""; }
    const valid = Buffer.isBuffer(data) && data.length > 0 && ((mime === "image/png" && data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) || (mime === "image/jpeg" && data[0] === 255 && data[1] === 216 && data[2] === 255) || (mime === "image/webp" && data.toString("ascii",0,4) === "RIFF" && data.toString("ascii",8,12) === "WEBP"));
    if (!valid || !title) { res.status(400).json({ message: "Upload a valid PNG, JPEG or WebP image and title." }); return; }
    try { res.status(201).json({ data: await useCase.createMedia(title, mime, data, req.authenticatedUser!.userId) }); } catch (error) { next(error); }
  });
  router.get("/website/media/:id", ...protect, async (req, res, next) => {
    const id = websiteIdSchema.safeParse(req.params.id); if (!id.success) { res.status(404).json({ message: "Media not found." }); return; }
    try { const data = await useCase.get("media", id.data); if (!data) { res.status(404).json({ message: "Media not found." }); return; } res.json({ data }); } catch (error) { next(error); }
  });
  router.get("/website/media/:id/file", ...protect, async (req, res, next) => {
    const id = websiteIdSchema.safeParse(req.params.id); if (!id.success) { res.status(404).json({ message: "Media not found." }); return; }
    try { const file = await useCase.getMediaFile(id.data); if (!file) { res.status(404).json({ message: "Media not found." }); return; } res.type(file.contentType).setHeader("Cache-Control", "private, no-store").send(Buffer.from(file.data)); } catch (error) { next(error); }
  });
  router.post("/website/media/:id/status", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const id = websiteIdSchema.safeParse(req.params.id), input = websiteTransitionSchema.safeParse(req.body);
    if (!id.success || !input.success) { res.status(400).json({ message: "Media status is invalid." }); return; }
    try { const data = await useCase.transition("media", id.data, input.data.status, req.authenticatedUser!.userId); if (!data) { res.status(404).json({ message: "Media not found." }); return; } res.json({ data }); } catch (error) { if (statusError(error)) { res.status(409).json({ message: "This status change is not allowed." }); return; } next(error); }
  });
  router.get("/website/pages/:pageId", ...protect, async (req, res, next) => {
    const id = websiteIdSchema.safeParse(req.params.pageId); if (!id.success) { res.status(404).json({ message: "Page not found." }); return; }
    try { const data = await useCase.get("page", id.data); if (!data) { res.status(404).json({ message: "Page not found." }); return; } res.json({ message: "Page loaded.", data }); } catch (error) { next(error); }
  });
  router.post("/website/pages", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const input = websitePageWriteSchema.safeParse(req.body); const actor = req.authenticatedUser?.userId;
    if (!input.success) { res.status(400).json({ message: "Page details are invalid.", issues: input.error.flatten() }); return; }
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    try { res.status(201).json({ message: "Page saved as draft.", data: await useCase.createPage(input.data, actor) }); }
    catch (error) { if (conflict(error)) { res.status(409).json({ message: "That page slug is already in use." }); return; } next(error); }
  });
  router.patch("/website/pages/:pageId", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const id = websiteIdSchema.safeParse(req.params.pageId); const input = websitePageWriteSchema.safeParse(req.body); const actor = req.authenticatedUser?.userId;
    if (!id.success) { res.status(404).json({ message: "Page not found." }); return; }
    if (!input.success) { res.status(400).json({ message: "Page details are invalid.", issues: input.error.flatten() }); return; }
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    try { const data = await useCase.updatePage(id.data, input.data, actor); if (!data) { res.status(404).json({ message: "Page not found." }); return; } res.json({ message: "Page changes saved.", data }); }
    catch (error) { if (conflict(error)) { res.status(409).json({ message: "That page slug is already in use." }); return; } if (statusError(error)) { res.status(409).json({ message: "This page changed in another session. Reload it before saving." }); return; } next(error); }
  });
  router.post("/website/pages/:pageId/status", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const id = websiteIdSchema.safeParse(req.params.pageId); const input = websiteTransitionSchema.safeParse(req.body); const actor = req.authenticatedUser?.userId;
    if (!id.success) { res.status(404).json({ message: "Page not found." }); return; }
    if (!input.success) { res.status(400).json({ message: "Page status is invalid." }); return; }
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    try { const data = await useCase.transition("page", id.data, input.data.status, actor); if (!data) { res.status(404).json({ message: "Page not found." }); return; } res.json({ message: `Page ${input.data.status}.`, data }); }
    catch (error) { if (statusError(error)) { res.status(409).json({ message: error instanceof Error && error.message === "WEBSITE_TRANSITION_INVALID" ? "That page status change is not allowed." : "This page changed in another session. Reload it." }); return; } next(error); }
  });

  router.get("/website/news/:newsId", ...protect, async (req, res, next) => {
    const id = websiteIdSchema.safeParse(req.params.newsId); if (!id.success) { res.status(404).json({ message: "News post not found." }); return; }
    try { const data = await useCase.get("news", id.data); if (!data) { res.status(404).json({ message: "News post not found." }); return; } res.json({ message: "News post loaded.", data }); } catch (error) { next(error); }
  });
  router.post("/website/news", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const input = websiteNewsWriteSchema.safeParse(req.body); const actor = req.authenticatedUser?.userId;
    if (!input.success) { res.status(400).json({ message: "News post details are invalid.", issues: input.error.flatten() }); return; }
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    try { res.status(201).json({ message: "News post saved as draft.", data: await useCase.createNews(input.data, actor) }); }
    catch (error) { if (conflict(error)) { res.status(409).json({ message: "That news slug is already in use." }); return; } next(error); }
  });
  router.patch("/website/news/:newsId", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const id = websiteIdSchema.safeParse(req.params.newsId); const input = websiteNewsWriteSchema.safeParse(req.body); const actor = req.authenticatedUser?.userId;
    if (!id.success) { res.status(404).json({ message: "News post not found." }); return; }
    if (!input.success) { res.status(400).json({ message: "News post details are invalid.", issues: input.error.flatten() }); return; }
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    try { const data = await useCase.updateNews(id.data, input.data, actor); if (!data) { res.status(404).json({ message: "News post not found." }); return; } res.json({ message: "News changes saved.", data }); }
    catch (error) { if (conflict(error)) { res.status(409).json({ message: "That news slug is already in use." }); return; } if (statusError(error)) { res.status(409).json({ message: "This news post changed in another session. Reload it before saving." }); return; } next(error); }
  });
  router.post("/website/news/:newsId/status", ...protect, async (req: AuthenticatedRequest, res, next) => {
    const id = websiteIdSchema.safeParse(req.params.newsId); const input = websiteTransitionSchema.safeParse(req.body); const actor = req.authenticatedUser?.userId;
    if (!id.success) { res.status(404).json({ message: "News post not found." }); return; }
    if (!input.success) { res.status(400).json({ message: "News post status is invalid." }); return; }
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    try { const data = await useCase.transition("news", id.data, input.data.status, actor); if (!data) { res.status(404).json({ message: "News post not found." }); return; } res.json({ message: `News post ${input.data.status}.`, data }); }
    catch (error) { if (statusError(error)) { res.status(409).json({ message: error instanceof Error && error.message === "WEBSITE_TRANSITION_INVALID" ? "That news status change is not allowed." : "This news post changed in another session. Reload it." }); return; } next(error); }
  });
  return router;
}
