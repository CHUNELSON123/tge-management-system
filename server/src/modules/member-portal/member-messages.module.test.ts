import test from "node:test";
import assert from "node:assert/strict";

test("call expiry starts once on demand and stops cleanly", async (t) => {
  process.env.DATABASE_URL ??= "postgresql://unused:unused@127.0.0.1:1/tge_qa_expiry";
  const { PrismaCallHistoryRepository } = await import("./infrastructure/prisma-call-history.repository.js");
  let calls = 0;
  t.mock.method(PrismaCallHistoryRepository.prototype, "expire", async () => { calls++; });
  const { startCallExpiry, stopCallExpiry } = await import("./member-messages.module.js");
  t.after(stopCallExpiry);
  assert.equal(calls, 0, "importing routers must not start database work");
  startCallExpiry();
  startCallExpiry();
  assert.equal(calls, 1, "repeated startup must not create multiple jobs");
  stopCallExpiry();
  startCallExpiry();
  assert.equal(calls, 2, "a stopped job can be restarted");
});
