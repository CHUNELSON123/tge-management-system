import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const worker = readFileSync(fileURLToPath(new URL("../public/notification-worker.js", import.meta.url)), "utf8");
test("notification click focuses an existing tab and sends its destination", async () => {
  let handler; let sent; let focused = false; let closed = false; let done;
  const tab = { url: "https://tge.example/portal", postMessage: (message) => { sent = message; }, focus: async () => { focused = true; } };
  const self = { location: { origin: "https://tge.example" }, clients: { matchAll: async () => [tab], openWindow: async () => { throw new Error("unexpected new window"); } }, addEventListener: (_name, listener) => { handler = listener; } };
  runInNewContext(worker, { self, URL });
  handler({ notification: { data: { path: "/portal/messages?conversation=123" }, close() { closed = true; } }, waitUntil(promise) { done = promise; } });
  await done;
  assert.equal(sent.type, "tge:open-notification");
  assert.equal(sent.path, "/portal/messages?conversation=123");
  assert.equal(focused, true); assert.equal(closed, true);
});
test("notification click rejects external destinations", async () => {
  let handler; let opened; let done;
  const self = { location: { origin: "https://tge.example" }, clients: { matchAll: async () => [], openWindow: async (path) => { opened = path; } }, addEventListener: (_name, listener) => { handler = listener; } };
  runInNewContext(worker, { self, URL });
  handler({ notification: { data: { path: "//outside.example" }, close() {} }, waitUntil(promise) { done = promise; } });
  await done; assert.equal(opened, "/");
});

