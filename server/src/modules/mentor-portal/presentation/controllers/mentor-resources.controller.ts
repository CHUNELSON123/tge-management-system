import { extname } from "node:path";
import { raw, Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../../../../common/middleware/authenticate.middleware.js";
import type { UploadMentorResourceUseCase } from "../../application/use-cases/upload-mentor-resource.usecase.js";
const types: Record<string, string> = { ".pdf": "application/pdf", ".doc": "application/msword", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".ppt": "application/vnd.ms-powerpoint", ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation", ".xls": "application/vnd.ms-excel", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".mp4": "video/mp4" };
function signature(extension: string, data: Buffer) { if (extension === ".pdf") return data.subarray(0, 5).toString() === "%PDF-"; if (extension === ".png") return data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])); if ([".jpg", ".jpeg"].includes(extension)) return data[0] === 255 && data[1] === 216 && data[2] === 255; if (extension === ".mp4") return data.length > 12 && data.toString("ascii", 4, 8) === "ftyp"; if ([".doc", ".ppt", ".xls"].includes(extension)) return data.subarray(0, 8).equals(Buffer.from([208,207,17,224,161,177,26,225])); return data.subarray(0, 2).toString() === "PK"; }
const meta = z.object({ title: z.string().trim().min(1).max(250), categoryId: z.string().uuid(), targetType: z.enum(["programme", "cohort"]), targetId: z.string().uuid() });
export function createMentorResourcesRouter(useCase: UploadMentorResourceUseCase) {
  const router = Router(); router.use(authenticate, (req: AuthenticatedRequest, res, next) => { if (req.authenticatedUser?.roleName !== "Mentor") { res.status(403).json({ message: "Mentor access required." }); return; } next(); });
  router.get("/resources/categories", async (_req, res, next) => { try { res.json({ data: await useCase.categories() }); } catch (error) { next(error); } });
  router.post("/resources/upload", raw({ type: "application/octet-stream", limit: "50mb" }), async (req: AuthenticatedRequest, res, next) => {
    const input = meta.safeParse(req.query); let filename = ""; try { filename = decodeURIComponent(String(req.header("x-file-name") ?? "")).replace(/[\\/\r\n\0]/g, "_").slice(0, 255); } catch { /* invalid encoding */ }
    const extension = extname(filename).toLowerCase(), mime = types[extension], bytes = req.body;
    if (!input.success || !mime || !Buffer.isBuffer(bytes) || !bytes.length || !signature(extension, bytes)) { res.status(400).json({ message: "Choose a valid file, category and assigned programme or cohort." }); return; }
    try { const data = await useCase.execute(req.authenticatedUser!.userId, { ...input.data, filename, mimeType: mime, content: bytes }); res.status(201).json({ message: "Resource shared.", data }); }
    catch (error) { if (error instanceof Error && error.message === "RESOURCE_TARGET_INVALID") { res.status(403).json({ message: "Choose a valid category and a programme or cohort assigned to you." }); return; } next(error); }
  });
  return router;
}
