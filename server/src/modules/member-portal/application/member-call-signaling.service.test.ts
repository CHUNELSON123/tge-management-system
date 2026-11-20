import { test } from "node:test";
import assert from "node:assert/strict";
import { MemberCallSignalingService } from "./member-call-signaling.service.js";
import type { MemberMessagesRepository } from "../domain/member-messages.repository.js";

test("incoming discovery targets the recipient and clears after an answer or end", async () => {
  const repository = { findCallPeer: async (user: string) => user === "a" ? "b" : "a" } as unknown as MemberMessagesRepository;
  const service = new MemberCallSignalingService(repository);
  const offer = { callId: "call-1", kind: "offer" as const, media: "audio" as const, payload: null };
  await service.publish("a", "conversation", offer);
  assert.deepEqual(service.pendingOffer("b"), { conversationId: "conversation", fromUserId: "a" });
  assert.equal(service.pendingOffer("a"), null);
  await service.publish("b", "conversation", { ...offer, kind: "answer" });
  assert.equal(service.pendingOffer("b"), null);
  assert.deepEqual((await service.list("b", "conversation", 0))?.signals, []);
  await service.publish("a", "conversation", { ...offer, callId: "call-2" });
  await service.publish("a", "conversation", { ...offer, callId: "call-2", kind: "end" });
  assert.equal(service.pendingOffer("b"), null);
});

