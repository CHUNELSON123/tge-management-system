import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { once } from "node:events";
import { errorHandler } from "./error-handler.middleware.js";

test("API errors conceal secrets and reject malformed or oversized JSON", async () => {
  const app = express();
  app.use(express.json({ limit: "1kb" }));
  app.post("/failure", () => {
    throw new Error("postgresql://private-user:private-password@database/internal");
  });
  app.use(errorHandler);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/failure`;
  try {
    for (const [body, status, message] of [
      ["{}", 500, "An unexpected error occurred."],
      ["{", 400, "Invalid JSON body."],
      [JSON.stringify({ text: "x".repeat(2048) }), 413, "Request body is too large."],
    ] as const) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      assert.equal(response.status, status);
      assert.deepEqual(await response.json(), { message });
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
