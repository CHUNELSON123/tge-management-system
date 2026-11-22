import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "../../../common/middleware/authenticate.middleware.js";
import type { StartConversationUseCase } from "../application/start-conversation.usecase.js";
export function createConversationsRouter(useCase: StartConversationUseCase) {
  const router = Router(); router.use(authenticate, (req: AuthenticatedRequest, res, next) => { if (!["Member", "Mentor", "System Administrator", "Organisation Administrator"].includes(req.authenticatedUser?.roleName ?? "")) { res.status(403).json({ message: "Messaging access is required." }); return; } next(); });
  router.get("/contacts", async (req: AuthenticatedRequest, res, next) => { const query = z.string().trim().min(2).max(100).safeParse(req.query.q); if (!query.success) { res.status(400).json({ message: "Enter at least two characters." }); return; } try { res.json({ data: await useCase.search(req.authenticatedUser!.userId, query.data) }); } catch (error) { next(error); } });
  router.post("/conversations", async (req: AuthenticatedRequest, res, next) => { const input = z.object({ recipientId: z.string().uuid() }).strict().safeParse(req.body); if (!input.success) { res.status(400).json({ message: "Choose a valid recipient." }); return; } try { const data = await useCase.start(req.authenticatedUser!.userId, input.data.recipientId); if (!data) { res.status(404).json({ message: "Recipient unavailable." }); return; } res.status(200).json({ data }); } catch (error) { next(error); } });
  return router;
}
