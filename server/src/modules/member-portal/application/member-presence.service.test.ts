import assert from "node:assert/strict";
import { test } from "node:test";
import { MemberPresenceService } from "./member-presence.service.js";

test("presence is shared through its repository and expires without a heartbeat", async () => {
  const stored = new Map<string, Date>();
  const repository = { async heartbeat(id: string, now: Date) { stored.set(id, now); }, async lastSeen(id: string) { return stored.get(id) ?? null; } };
  const first = new MemberPresenceService(repository), second = new MemberPresenceService(repository);
  await first.heartbeat("one", new Date(1000));
  assert.equal(await second.isOnline("one", new Date(46000)), true);
  assert.equal(await second.isOnline("one", new Date(46001)), false);
  assert.equal(await second.isOnline("two", new Date(1000)), false);
});
