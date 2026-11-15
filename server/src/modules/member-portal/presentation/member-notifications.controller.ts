import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../../../common/middleware/authenticate.middleware.js";
import type { GetMemberNotificationsUseCase } from "../application/get-member-notifications.usecase.js";

export function createMemberNotificationsRouter(useCase: GetMemberNotificationsUseCase): Router {
  const router = Router();
  router.get("/notifications", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser;
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    if (actor.roleName !== "Member") { res.status(403).json({ message: "Member access is required." }); return; }
    try { res.status(200).json({ message: "Member notifications loaded.", data: await useCase.execute(actor.userId) }); }
    catch { res.status(503).json({ message: "Member notifications are temporarily unavailable." }); }
  });
  router.patch("/notifications/:notificationId/read", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser;
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    if (actor.roleName !== "Member") { res.status(403).json({ message: "Member access is required." }); return; }
    const id = Array.isArray(req.params.notificationId) ? req.params.notificationId[0] : req.params.notificationId;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) { res.status(404).json({ message: "Notification not found." }); return; }
    try {
      if (!await useCase.markRead(actor.userId, id)) { res.status(404).json({ message: "Notification not found." }); return; }
      res.status(200).json({ message: "Notification marked as read." });
    } catch { res.status(503).json({ message: "Notification could not be updated." }); }
  });
  router.patch("/notifications/read-all", authenticate, async (req: AuthenticatedRequest, res) => {
    const actor = req.authenticatedUser;
    if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
    if (actor.roleName !== "Member") { res.status(403).json({ message: "Member access is required." }); return; }
    try { res.status(200).json({ message: "Notifications marked as read.", data: { updated: await useCase.markAllRead(actor.userId) } }); }
    catch { res.status(503).json({ message: "Notifications could not be updated." }); }
  });
  return router;
}
