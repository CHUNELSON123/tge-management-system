import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

const ACCESS_TOKEN_TTL = "15m";
const JWT_ISSUER = "tge-management-api";
const JWT_AUDIENCE = "tge-management-client";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }

  return secret;
};

export interface AccessTokenPayload {
  sub: string;
  jti: string;
  exp: number;
}

export class JwtService {
  signAccessToken(userId: string): string {
    return jwt.sign(
      { sub: userId, jti: randomUUID() },
      getJwtSecret(),
      {
        algorithm: "HS256",
        expiresIn: ACCESS_TOKEN_TTL,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      },
    );
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      typeof payload.jti !== "string" ||
      typeof payload.exp !== "number"
    ) {
      throw new Error("INVALID_ACCESS_TOKEN");
    }

    return { sub: payload.sub, jti: payload.jti, exp: payload.exp };
  }
}
