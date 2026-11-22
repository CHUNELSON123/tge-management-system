import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { InvalidAccessTokenError, JwtService } from "../services/jwt.service.js";
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

export function createAuthenticateMiddleware(
  database: Pick<typeof prisma, "revokedAccessToken" | "user"> = prisma,
  tokenService: Pick<JwtService, "verifyAccessToken"> = jwtService,
) {
  return async function authenticate(
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
      const payload = tokenService.verifyAccessToken(token);

      const revoked = await database.revokedAccessToken.findUnique({
        where: { tokenId: payload.jti },
        select: { id: true },
      });

      if (revoked) {
        res.status(401).json({ message: "Invalid or expired access token." });
        return;
      }

      const user = await database.user.findFirst({
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
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof InvalidAccessTokenError) {
        res.status(401).json({ message: "Invalid or expired access token." });
        return;
      }
      // Database/configuration failures must not masquerade as bad credentials.
      // The central error handler conceals internal details in its 500 response.
      next(error);
    }
  };
}

export const authenticate = createAuthenticateMiddleware();
