import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import express from "express";
import bcrypt from "bcrypt";
import { createFirstAdminRouter } from "./first-admin.controller.js";

test("first admin setup requires a secret and closes after account creation", async () => {
  const previous = process.env.FIRST_ADMIN_SETUP_KEY;
  const key = "a-long-private-setup-key-with-32-characters";
  process.env.FIRST_ADMIN_SETUP_KEY = key;
  let account: { passwordHash: string; email: string; status: string } | undefined;
  let otherAdministrators = 0;
  const tx = {
    $queryRaw: async () => [{ id: "admin-role" }],
    user: {
      findFirst: async () => account ? { id: "admin" } : null,
      count: async () => otherAdministrators + (account ? 1 : 0),
      findUnique: async () => null,
      create: async ({ data }: { data: typeof account }) => { account = data; return { id: "admin" }; },
    },
    auditLog: { create: async () => ({}) },
  };
  const database = { $transaction: async (fn: (transaction: typeof tx) => Promise<unknown>) => fn(tx) };
  const app = express(); app.use(express.json()); app.use(createFirstAdminRouter(database as never));
  const server = createServer(app); server.listen(0); await once(server, "listening");
  const address = server.address(); if (!address || typeof address === "string") throw new Error("No test port");
  const payload = { firstName: "First", lastName: "Admin", email: "ADMIN@example.com", password: "safe-password", setupKey: key };
  const send = (body: unknown) => fetch(`http://127.0.0.1:${address.port}/first-admin`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  try {
    assert.equal((await send({ ...payload, setupKey: "wrong" })).status, 403);
    assert.equal(account, undefined);
    assert.equal((await send({ ...payload, password: "short" })).status, 400);
    otherAdministrators = 3;
    assert.equal((await send(payload)).status, 409);
    assert.equal(account, undefined);
    otherAdministrators = 0;
    assert.equal((await send(payload)).status, 201);
    const saved = account as { passwordHash: string; email: string; status: string } | undefined;
    assert.ok(saved);
    assert.equal(saved.email, "admin@example.com");
    assert.equal(saved.status, "ACTIVE");
    assert.equal(await bcrypt.compare(payload.password, saved.passwordHash), true);
    assert.equal((await send(payload)).status, 409);
    delete process.env.FIRST_ADMIN_SETUP_KEY;
    assert.equal((await send(payload)).status, 403);
  } finally {
    if (previous === undefined) delete process.env.FIRST_ADMIN_SETUP_KEY;
    else process.env.FIRST_ADMIN_SETUP_KEY = previous;
    server.close();
  }
});
