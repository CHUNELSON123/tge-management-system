import type { Request, Response, NextFunction } from "express";
import { JwtService } from "../services/jwt.service.js";
import { prisma } from "../../infrastructure/database/prisma-client.js";

const jwtService = new JwtService();

export interface AuthenticatedRequest extends Request {
  authenticatedUser?: {
    userId: string;
    roleId: string;
    roleName: string;
    tokenId: string;
    tokenExpiresAt: Date;
  };
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }

    const token = authorization.slice(7);
    const payload = jwtService.verifyAccessToken(token);

    const revoked = await prisma.revokedAccessToken.findUnique({
      where: { tokenId: payload.jti },
      select: { id: true },
    });

    if (revoked) {
      res.status(401).json({ message: "Invalid or expired access token." });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: payload.sub,
        status: "ACTIVE",
        deletedAt: null,
      },
      include: { role: true },
    });

    if (!user) {
      res.status(401).json({ message: "Invalid or inactive account." });
      return;
    }

    req.authenticatedUser = {
      userId: user.id,
      roleId: user.roleId,
      roleName: user.role.name,
      tokenId: payload.jti,
      tokenExpiresAt: new Date(payload.exp * 1000),
    };

    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired access token." });
  }
}
