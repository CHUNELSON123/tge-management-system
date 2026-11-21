import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../../../../common/middleware/authenticate.middleware.js";
import { requirePermission } from "../../../../common/middleware/require-role.middleware.js";
import type { GetAdminHeaderUseCase } from "../../application/get-admin-header.usecase.js";

export function createAdminHeaderRouter(useCase: GetAdminHeaderUseCase): Router {
  const router = Router();
  router.get("/header", authenticate, requirePermission("reports.view"), async (req: AuthenticatedRequest, res, next) => {
    const userId = req.authenticatedUser?.userId;
    if (!userId) { res.status(401).json({ message: "Authentication required." }); return; }
    try {
      const data = await useCase.execute(userId);
      res.status(200).json({ message: "Admin header loaded.", data });
    } catch (error) { next(error); }
  });
  router.get("/profile-photo", authenticate, requirePermission("reports.view"), async (req: AuthenticatedRequest, res, next) => {
    const userId = req.authenticatedUser?.userId;
    if (!userId) { res.status(401).json({ message: "Authentication required." }); return; }
    try {
      const photo = await useCase.getProfilePhoto(userId);
      if (!photo) { res.status(404).json({ message: "Profile photo not found." }); return; }
      res.type(photo.contentType).setHeader("Cache-Control", "private, no-store").send(Buffer.from(photo.data));
    } catch (error) { next(error); }
  });
  router.patch("/notifications/:notificationId/read", authenticate, requirePermission("reports.view"), async (req: AuthenticatedRequest, res, next) => {
    const userId = req.authenticatedUser?.userId;
    const id = Array.isArray(req.params.notificationId) ? req.params.notificationId[0] : req.params.notificationId;
    if (!userId) { res.status(401).json({ message: "Authentication required." }); return; }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) { res.status(404).json({ message: "Notification not found." }); return; }
    try {
      if (!await useCase.markNotificationRead(userId, id)) { res.status(404).json({ message: "Notification not found." }); return; }
      res.status(200).json({ message: "Notification marked as read." });
    } catch (error) { next(error); }
  });
  return router;
}
