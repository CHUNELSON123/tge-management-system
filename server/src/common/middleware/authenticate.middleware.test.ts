import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { once } from "node:events";
import { JwtService } from "../services/jwt.service.js";
import { createAuthenticateMiddleware } from "./authenticate.middleware.js";
import { errorHandler } from "./error-handler.middleware.js";

test("missing revocation table produces a safe server error, not an invalid-token response", async (t) => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "isolated-middleware-test-key-over-32-characters";
  t.after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });
  const databaseFailure = new Error("Missing revoked_access_tokens; private database details");
  const lookup = t.mock.fn(async () => { throw databaseFailure; });
  const database = { revokedAccessToken: { findUnique: lookup } } as unknown as Parameters<typeof createAuthenticateMiddleware>[0];
  const token = new JwtService().signAccessToken("00000000-0000-4000-8000-000000000001");
  const app = express();
  app.get("/protected", createAuthenticateMiddleware(database), (_req, res) => res.json({ allowed: true }));
  app.use(errorHandler);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/protected`;
  try {
    for (const authorization of [undefined, "Bearer invalid-token"]) {
      const response = await fetch(url, { headers: authorization ? { Authorization: authorization } : {} });
      assert.equal(response.status, 401);
    }
    assert.equal(lookup.mock.callCount(), 0);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { message: "An unexpected error occurred." });
    assert.equal(lookup.mock.callCount(), 1);

    delete process.env.JWT_SECRET;
    const missingConfig = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(missingConfig.status, 500);
    assert.deepEqual(await missingConfig.json(), { message: "An unexpected error occurred." });
    assert.equal(lookup.mock.callCount(), 1);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
