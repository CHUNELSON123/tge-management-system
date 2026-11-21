import { raw, Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../../../common/middleware/authenticate.middleware.js";
import type { ChatAttachmentsUseCase } from "../application/chat-attachments.usecase.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const extensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv)$/i;
export function createChatAttachmentsRouter(useCase: ChatAttachmentsUseCase) {
  const router = Router();
  router.post("/conversations/:conversationId/attachments", authenticate, raw({ type: "application/octet-stream", limit: "10mb" }), async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser; const id = String(req.params.conversationId);
    if (!actor || !["Member", "Mentor", "System Administrator", "Organisation Administrator"].includes(actor.roleName)) { res.status(403).json({ message: "Messaging access is required." }); return; }
    let filename = ""; try { filename = decodeURIComponent(String(req.headers["x-file-name"] || "")); } catch { /* Invalid filename. */ }
    if (!uuid.test(id) || !Buffer.isBuffer(req.body) || !req.body.length || !filename || filename.length > 200 || /[\\/\x00-\x1f\x7f]/.test(filename) || !extensions.test(filename)) { res.status(400).json({ message: "Choose a document (PDF, Office, TXT or CSV) up to 10 MB." }); return; }
    try { const message = await useCase.upload(actor.userId, id, filename, req.body); if (!message) { res.status(404).json({ message: "Conversation not found." }); return; } res.status(201).json({ data: message }); }
    catch { res.status(503).json({ message: "Document could not be uploaded." }); }
  });
  router.get("/attachments/:attachmentId", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser; const id = String(req.params.attachmentId);
    if (!actor || !["Member", "Mentor", "System Administrator", "Organisation Administrator"].includes(actor.roleName)) { res.status(403).json({ message: "Messaging access is required." }); return; }
    if (!uuid.test(id)) { res.status(404).json({ message: "Document not found." }); return; }
    try {
      const file = await useCase.download(actor.userId, id); if (!file) { res.status(404).json({ message: "Document not found." }); return; }
      const encoded = encodeURIComponent(file.originalFilename).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
      res.setHeader("Content-Type", "application/octet-stream"); res.setHeader("Content-Disposition", `attachment; filename="document"; filename*=UTF-8''${encoded}`); res.setHeader("Cache-Control", "private, no-store"); res.setHeader("X-Content-Type-Options", "nosniff"); res.send(file.bytes);
    } catch { res.status(503).json({ message: "Document could not be downloaded." }); }
  });
  return router;
}
