import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { JwtService } from "./jwt.service.js";

test("JWT accepts a correctly signed access token and rejects tampered/expired tokens", () => {
  process.env.JWT_SECRET = "unit-test-secret-with-more-than-32-characters";
  const service = new JwtService();
  const valid = service.signAccessToken("user-1");
  assert.equal(service.verifyAccessToken(valid).sub, "user-1");
  assert.throws(() => service.verifyAccessToken(`${valid}x`));
  const expired = jwt.sign({ sub: "user-1", jti: randomUUID() }, process.env.JWT_SECRET!, {
    algorithm: "HS256", issuer: "tge-management-api", audience: "tge-management-client", expiresIn: -1,
  });
  assert.throws(() => service.verifyAccessToken(expired));
});

test("JWT refuses short or missing signing secrets", () => {
  const previous = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "too-short";
  assert.throws(() => new JwtService().signAccessToken("user-1"));
  delete process.env.JWT_SECRET;
  assert.throws(() => new JwtService().signAccessToken("user-1"));
  if (previous) process.env.JWT_SECRET = previous;
});
