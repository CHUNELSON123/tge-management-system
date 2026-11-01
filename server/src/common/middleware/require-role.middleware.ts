import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./authenticate.middleware.js";
import { prisma } from "../../infrastructure/database/prisma-client.js";

export function requirePermission(permission: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roleId = req.authenticatedUser?.roleId;
      if (!roleId) {
        res.status(401).json({ message: "Authentication required." });
        return;
      }
      const grant = await prisma.rolePermission.findFirst({
        where: { roleId, permission: { code: permission } },
        select: { roleId: true },
      });
      if (!grant) {
        res.status(403).json({ message: "You do not have permission to perform this action." });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
