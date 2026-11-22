import { raw, Router } from "express";
import { Readable } from "node:stream";
import { basename } from "node:path";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../../../../common/middleware/authenticate.middleware.js";
import type { MentorPortalUseCase } from "../../application/use-cases/mentor-portal.usecase.js";
import { mentorProfileUpdateSchema } from "../dto/mentor-profile.dto.js";
import { MemberProfilePhotoUseCase } from "../../../member-portal/application/member-profile-photo.usecase.js";
import { PrismaMemberProfilePhotoRepository } from "../../../member-portal/infrastructure/prisma-member-profile-photo.repository.js";

export function createMentorPortalRouter(useCase: MentorPortalUseCase) {
  const router = Router();
  const photos = new MemberProfilePhotoUseCase(new PrismaMemberProfilePhotoRepository());
  router.use(authenticate, (req: AuthenticatedRequest, res, next) => {
    if (req.authenticatedUser?.roleName !== "Mentor") { res.status(403).json({ message: "Mentor access is required." }); return; }
    next();
  });
  router.get("/profile", async (req: AuthenticatedRequest, res, next) => { try { const data = await useCase.profile(req.authenticatedUser!.userId); if (!data) { res.status(404).json({ message: "Mentor profile not found." }); return; } res.json({ data }); } catch (error) { next(error); } });
  router.get("/profile/photo", async (req: AuthenticatedRequest, res, next) => { try { const photo = await photos.get(req.authenticatedUser!.userId); if (!photo) { res.status(404).json({ message: "Photo not found." }); return; } res.setHeader("Cache-Control", "private, no-store"); res.setHeader("X-Content-Type-Options", "nosniff"); res.type(photo.contentType).send(Buffer.from(photo.data)); } catch (error) { next(error); } });
  router.put("/profile/photo", raw({ type: ["image/jpeg", "image/png"], limit: "2mb" }), async (req: AuthenticatedRequest, res, next) => { const type = req.headers["content-type"]?.split(";")[0], data = req.body; const valid = !Array.isArray(data) && Buffer.isBuffer(data) && (type === "image/jpeg" ? data.length >= 3 && data[0] === 255 && data[1] === 216 && data[2] === 255 : type === "image/png" && data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))); if (!valid || !type) { res.status(400).json({ message: "Choose a JPG or PNG image up to 2 MB." }); return; } try { await photos.save(req.authenticatedUser!.userId, { contentType: type, data }); res.json({ message: "Profile photo saved." }); } catch (error) { next(error); } });
  router.patch("/profile", async (req: AuthenticatedRequest, res, next) => { const input = mentorProfileUpdateSchema.safeParse(req.body); if (!input.success) { res.status(400).json({ message: "Profile details are invalid.", issues: input.error.flatten() }); return; } try { const data = await useCase.updateProfile(req.authenticatedUser!.userId, input.data); if (!data) { res.status(404).json({ message: "Mentor profile not found." }); return; } res.json({ data }); } catch (error) { next(error); } });
  router.get("/assigned-work", async (req: AuthenticatedRequest, res, next) => { try { const data = await useCase.assignedWork(req.authenticatedUser!.userId); if (!data) { res.status(404).json({ message: "Mentor profile not found." }); return; } res.json({ data }); } catch (error) { next(error); } });
  router.get("/sessions", async (req: AuthenticatedRequest, res, next) => { try { res.json({ data: await useCase.sessions(req.authenticatedUser!.userId) }); } catch (error) { next(error); } });
  router.get("/resources/:resourceId/file", async (req: AuthenticatedRequest, res, next) => {
    const id = z.string().uuid().safeParse(req.params.resourceId); if (!id.success) { res.status(404).json({ message: "Resource not found." }); return; }
    try { const file = await useCase.resourceFile(req.authenticatedUser!.userId, id.data); if (!file) { res.status(404).json({ message: "Resource not found." }); return; }
      const filename = basename(file.filename).replace(/[\r\n"\\]/g, "_").slice(0, 200) || "resource";
      const encoded = encodeURIComponent(filename).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
      res.setHeader("Content-Type", /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(file.mimeType) ? file.mimeType : "application/octet-stream");
      res.setHeader("Content-Length", String(file.fileSize)); res.setHeader("Content-Disposition", `attachment; filename="${filename}"; filename*=UTF-8''${encoded}`);
      res.setHeader("Cache-Control", "private, no-store"); res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("Content-Security-Policy", "sandbox");
      Readable.from(file.content).on("error", () => res.destroy()).pipe(res);
    } catch (error) { next(error); }
  });
  return router;
}
