import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../../../../common/middleware/authenticate.middleware.js";
import type { GetAdminAccessUseCase } from "../../application/get-admin-access.usecase.js";
import type { AdminAccessDto } from "../dto/admin-access.dto.js";

export function createAdminPortalRouter(getAdminAccess: GetAdminAccessUseCase): Router {
  const router = Router();
  router.get("/access", authenticate, async (req: AuthenticatedRequest, res, next) => {
    try {
      const actor = req.authenticatedUser;
      if (!actor) { res.status(401).json({ message: "Authentication required." }); return; }
      const data: AdminAccessDto = {
        userId: actor.userId,
        roleName: actor.roleName,
        permissions: await getAdminAccess.execute(actor.roleId),
      };
      if (data.permissions.length === 0) {
        res.status(403).json({ message: "Administrator access is required." });
        return;
      }
      res.status(200).json({ message: "Administrator access loaded.", data });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
