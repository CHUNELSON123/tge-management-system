import type { Request, Response, NextFunction } from "express";
import { JwtService } from "../services/jwt.service.js";
import { prisma } from "../../infrastructure/database/prisma-client.js";

const jwtService = new JwtService();

export interface AuthenticatedRequest extends Request {
  authenticatedUser?: {
    userId: string;
    roleName: string;
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
      roleName: user.role.name,
    };

    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired access token." });
  }
}
