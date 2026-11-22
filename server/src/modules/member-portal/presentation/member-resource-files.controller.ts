import { Readable } from "node:stream";
import { basename } from "node:path";
import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../../../common/middleware/authenticate.middleware.js";
import type { GetMemberResourceFileUseCase } from "../application/get-member-resource-file.usecase.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const previewTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain"]);

export function createMemberResourceFilesRouter(getFile: GetMemberResourceFileUseCase): Router {
  const router = Router();
  router.get("/resources/:resourceId/file", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser;
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    if (actor.roleName !== "Member") { res.status(403).json({ message: "Member access is required." }); return; }
    const resourceId = Array.isArray(req.params.resourceId) ? req.params.resourceId[0] : req.params.resourceId;
    if (!uuid.test(resourceId)) { res.status(404).json({ message: "Resource file not found." }); return; }
    const download = req.query.download === "1";
    try {
      const file = await getFile.execute(actor.userId, resourceId);
      if (!file) { res.status(404).json({ message: "Resource file not found." }); return; }
      const mimeType = /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(file.mimeType) ? file.mimeType.toLowerCase() : "application/octet-stream";
      if (!download && !previewTypes.has(mimeType)) { res.status(415).json({ message: "Preview is not supported for this file type. Download the file to open it with a compatible application." }); return; }
      const filename = basename(file.filename).replace(/[\r\n"\\]/g, "_").slice(0, 200) || "resource";
      const encodedFilename = encodeURIComponent(filename).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
      res.status(200);
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Length", String(file.fileSize));
      res.setHeader("Content-Disposition", `${download ? "attachment" : "inline"}; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "sandbox");
      Readable.from(file.content).on("error", () => res.destroy()).pipe(res);
    } catch {
      res.status(503).json({ message: "Secure resource file access is temporarily unavailable." });
    }
  });
  return router;
}
