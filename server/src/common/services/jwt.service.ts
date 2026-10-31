import jwt from "jsonwebtoken";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }

  return secret;
};

export interface AccessTokenPayload {
  sub: string;
}

export class JwtService {
  signAccessToken(userId: string): string {
    return jwt.sign(
      { sub: userId },
      getJwtSecret(),
      { expiresIn: "15m" },
    );
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const payload = jwt.verify(token, getJwtSecret());

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string"
    ) {
      throw new Error("INVALID_ACCESS_TOKEN");
    }

    return { sub: payload.sub };
  }
}
