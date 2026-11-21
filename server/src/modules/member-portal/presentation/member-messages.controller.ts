import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../../../common/middleware/authenticate.middleware.js";
import type { GetMemberMessagesUseCase } from "../application/get-member-messages.usecase.js";
import type { MemberCallSignalingService } from "../application/member-call-signaling.service.js";
import { MemberPresenceService } from "../application/member-presence.service.js";
import { PrismaMemberPresenceRepository } from "../infrastructure/prisma-member-presence.repository.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const messageSchema = z.object({ body: z.string().trim().min(1).max(5000) }).strict();
const callSignalSchema = z.object({
  callId: z.string().regex(uuid), kind: z.enum(["offer", "answer", "ice", "end"]), media: z.enum(["audio", "video"]),
  payload: z.record(z.string(), z.unknown()).nullable().optional(),
}).strict();

export function createMemberMessagesRouter(useCase: GetMemberMessagesUseCase, signaling: MemberCallSignalingService, roles = ["Member"], presence = new MemberPresenceService(new PrismaMemberPresenceRepository())): Router {
  const router = Router();
  function actorOrRespond(req: AuthenticatedRequest, res: import("express").Response) {
    const actor = req.authenticatedUser;
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return null; }
    if (!roles.includes(actor.roleName)) { res.status(403).json({ message: "Messaging access is required." }); return null; }
    return actor;
  }
  router.post("/presence", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = actorOrRespond(req, res); if (!actor) return;
    try { await presence.heartbeat(actor.userId); res.status(200).json({ message: "Presence updated.", data: { success: true } }); }
    catch { res.status(503).json({ message: "Presence unavailable." }); }
  });
  router.get("/conversations/:conversationId/presence", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = actorOrRespond(req, res); if (!actor) return;
    const id = Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId;
    if (!uuid.test(id)) { res.status(404).json({ message: "Conversation not found." }); return; }
    try {
      const peer = await useCase.callPeer(actor.userId, id);
      if (!peer) { res.status(404).json({ message: "Direct conversation not found." }); return; }
      res.status(200).json({ message: "Presence loaded.", data: { online: await presence.isOnline(peer) } });
    } catch { res.status(503).json({ message: "Presence unavailable." }); }
  });
  router.get("/conversations", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = actorOrRespond(req, res); if (!actor) return;
    try { res.status(200).json({ message: "Member conversations loaded.", data: await useCase.list(actor.userId) }); }
    catch { res.status(503).json({ message: "Member conversations are temporarily unavailable." }); }
  });
  router.get("/incoming-call", authenticate, (req: AuthenticatedRequest, res) => {
    const actor = actorOrRespond(req, res); if (!actor) return;
    res.status(200).json({ message: "Incoming calls checked.", data: { call: signaling.pendingOffer(actor.userId) } });
  });
  router.get("/conversations/:conversationId", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = actorOrRespond(req, res); if (!actor) return;
    const id = Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId;
    if (!uuid.test(id)) { res.status(404).json({ message: "Conversation not found." }); return; }
    try {
      const data = await useCase.read(actor.userId, id);
      if (!data) { res.status(404).json({ message: "Conversation not found." }); return; }
      res.status(200).json({ message: "Conversation loaded.", data });
    } catch { res.status(503).json({ message: "Conversation is temporarily unavailable." }); }
  });
  router.post("/conversations/:conversationId/messages", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = actorOrRespond(req, res); if (!actor) return;
    const id = Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId;
    const parsed = messageSchema.safeParse(req.body);
    if (!uuid.test(id) || !parsed.success) { res.status(400).json({ message: "Enter a message up to 5,000 characters." }); return; }
    try {
      const message = await useCase.send(actor.userId, id, parsed.data.body);
      if (!message) { res.status(404).json({ message: "Conversation not found." }); return; }
      res.status(201).json({ message: "Message sent.", data: message });
    } catch { res.status(503).json({ message: "Message could not be sent." }); }
  });
  router.patch("/conversations/:conversationId/read", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = actorOrRespond(req, res); if (!actor) return;
    const id = Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId;
    const parsed = z.object({ messageId: z.string().regex(uuid) }).strict().safeParse(req.body);
    if (!uuid.test(id) || !parsed.success) { res.status(400).json({ message: "Invalid read receipt." }); return; }
    try {
      if (!await useCase.markRead(actor.userId, id, parsed.data.messageId)) { res.status(404).json({ message: "Message not found." }); return; }
      res.status(200).json({ message: "Conversation marked as read.", data: { success: true } });
    } catch { res.status(503).json({ message: "Read receipt could not be saved." }); }
  });
  router.get("/conversations/:conversationId/call-signals", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = actorOrRespond(req, res); if (!actor) return;
    const id = Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId;
    const after = Number(req.query.after ?? 0);
    if (!uuid.test(id) || !Number.isSafeInteger(after) || after < 0) { res.status(400).json({ message: "Call signal cursor is invalid." }); return; }
    try {
      const data = await signaling.list(actor.userId, id, after);
      if (!data) { res.status(404).json({ message: "A direct member conversation is required for calls." }); return; }
      res.status(200).json({ message: "Call signals loaded.", data });
    } catch { res.status(503).json({ message: "Call signaling is temporarily unavailable." }); }
  });
  router.post("/conversations/:conversationId/call-signals", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = actorOrRespond(req, res); if (!actor) return;
    const id = Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId;
    const parsed = callSignalSchema.safeParse(req.body);
    if (!uuid.test(id) || !parsed.success || JSON.stringify(parsed.data.payload ?? {}).length > 60_000) { res.status(400).json({ message: "Call signal is invalid or too large." }); return; }
    try {
      const signalId = await signaling.publish(actor.userId, id, { ...parsed.data, payload: parsed.data.payload ?? null });
      if (!signalId) { res.status(404).json({ message: "A direct member conversation is required for calls." }); return; }
      res.status(202).json({ message: "Call signal sent.", data: { signalId } });
    } catch { res.status(503).json({ message: "Call signal could not be sent." }); }
  });
  return router;
}
