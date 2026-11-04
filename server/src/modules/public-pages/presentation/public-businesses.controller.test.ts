import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import { once } from "node:events";
import { createPublicBusinessesRouter } from "./public-businesses.controller.js";

test("business browsing validates query capabilities and safely reports missing and unavailable businesses", async () => {
  const calls: unknown[] = [];
  const app = express();
  app.use("/api/public", createPublicBusinessesRouter(
    { execute: async (query: unknown) => { calls.push(query); return { items: [], total: 0, page: 1, pageSize: 12, totalPages: 0 }; } } as never,
    { execute: async () => [] } as never,
    { execute: async (slug: string) => { if (slug === "failure") throw new Error("private database error"); return null; } } as never,
  ));
  const server = createServer(app);
  server.listen(0);
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind.");
  const base = `http://127.0.0.1:${address.port}/api/public`;
  try {
    const listing = await fetch(`${base}/businesses?q=%20green%20`);
    assert.equal(listing.status, 200);
    assert.deepEqual(calls, [{ q: "green", page: 1, pageSize: 12 }]);
    for (const query of ["page=0", "pageSize=25", "q=a&q=b", "categoryId=invalid", "sort=private", "page=1.5"]) {
      const response = await fetch(`${base}/businesses?${query}`);
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { message: "Invalid business search parameters." });
    }
    const categories = await fetch(`${base}/business-categories`);
    assert.equal(categories.status, 200);
    assert.deepEqual(await categories.json(), { message: "Public business categories loaded.", data: [] });
    for (const slug of ["missing", "unapproved", "suspended"]) {
      const response = await fetch(`${base}/businesses/${slug}`);
      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { message: "Business not found." });
    }
    const failure = await fetch(`${base}/businesses/failure`);
    assert.equal(failure.status, 503);
    assert.deepEqual(await failure.json(), { message: "Business details are temporarily unavailable." });
  } finally { server.close(); }
});
