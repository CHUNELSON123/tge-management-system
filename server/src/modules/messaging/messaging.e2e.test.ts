import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import { resolve } from "node:path";
import dotenv from "dotenv";
import express from "express";
import { prisma } from "database";
import { JwtService } from "../../common/services/jwt.service.js";
import { conversationsRouter } from "./messaging.module.js";
import { sharedMessagesRouter } from "../member-portal/member-messages.module.js";
import { chatAttachmentsRouter } from "./chat-attachments.module.js";
import { unlink } from "node:fs/promises";
import { PrismaCallHistoryRepository } from "../member-portal/infrastructure/prisma-call-history.repository.js";

test("members, mentors and admins can message across and within roles immediately", async () => {
  dotenv.config({ path: resolve(process.cwd(), ".env") });
  const suffix = randomUUID();
  const ids: string[] = [];
  const conversationIds: string[] = [];
  const roles = await Promise.all(["Member", "Member", "Mentor", "Mentor", "Organisation Administrator", "Organisation Administrator"].map((name) => prisma.role.findUniqueOrThrow({ where: { name } })));
  const app = express(); app.use(express.json()); app.use("/messages", sharedMessagesRouter, chatAttachmentsRouter, conversationsRouter);
  const server = createServer(app); server.listen(0); await once(server, "listening");
  const address = server.address(); if (!address || typeof address === "string") throw new Error("Test server did not start");
  const base = `http://127.0.0.1:${address.port}/messages`; const jwt = new JwtService();
  const call = (method: string, path: string, token: string, body?: object) => fetch(base + path, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = async <T>(response: Response, expected: number) => { assert.equal(response.status, expected, await response.clone().text()); return ((await response.json()) as { data: T }).data; };
  try {
    for (let i = 0; i < roles.length; i++) {
      const user = await prisma.user.create({ data: { roleId: roles[i].id, email: `messaging-${i}-${suffix}@example.test`, firstName: `Contact${suffix.slice(0, 8)}`, lastName: `Person${i}`, passwordHash: "unused", status: "ACTIVE" } }); ids.push(user.id);
    }
    const inactive = await prisma.user.create({ data: { roleId: roles[0].id, email: `inactive-${suffix}@example.test`, firstName: `Contact${suffix.slice(0, 8)}`, lastName: "Inactive", passwordHash: "unused", status: "PENDING_ACTIVATION" } }); ids.push(inactive.id);
    const tokens = ids.map((id) => jwt.signAccessToken(id));
    const contacts = await data<{ id: string }[]>(await call("GET", `/contacts?q=${encodeURIComponent(`Contact${suffix.slice(0, 8)} Person1`)}`, tokens[0]), 200);
    assert.deepEqual(contacts.map((contact) => contact.id), [ids[1]]);
    const activeContacts = await data<{ id: string }[]>(await call("GET", `/contacts?q=${encodeURIComponent(`Contact${suffix.slice(0, 8)}`)}`, tokens[0]), 200);
    assert.ok(!activeContacts.some((contact) => contact.id === inactive.id || contact.id === ids[0]));
    assert.equal((await fetch(base + "/contacts?q=test")).status, 401);
    assert.equal((await call("POST", "/conversations", tokens[0], { recipientId: ids[0] })).status, 404);
    assert.equal((await call("POST", "/conversations", tokens[0], { recipientId: inactive.id })).status, 404);
    for (const [sender, receiver] of [[0,1], [2,3], [4,5], [0,2], [2,4], [4,0]]) {
      const conversation = await data<{ id: string }>(await call("POST", "/conversations", tokens[sender], { recipientId: ids[receiver] }), 200);
      conversationIds.push(conversation.id);
      const again = await data<{ id: string }>(await call("POST", "/conversations", tokens[receiver], { recipientId: ids[sender] }), 200);
      assert.equal(again.id, conversation.id);
      const sent = await data<{ id: string }>(await call("POST", `/conversations/${conversation.id}/messages`, tokens[sender], { body: `Hello ${receiver}` }), 201);
      const list = await data<{ id: string; unreadCount: number }[]>(await call("GET", "/conversations", tokens[receiver]), 200);
      assert.equal(list.find((item) => item.id === conversation.id)?.unreadCount, 1);
      const detail = await data<{ messages: { id: string; body: string }[] }>(await call("GET", `/conversations/${conversation.id}`, tokens[receiver]), 200);
      assert.equal(detail.messages.at(-1)?.body, `Hello ${receiver}`);
      await data(await call("PATCH", `/conversations/${conversation.id}/read`, tokens[receiver], { messageId: sent.id }), 200);
      const read = await data<{ id: string; unreadCount: number }[]>(await call("GET", "/conversations", tokens[receiver]), 200);
      assert.equal(read.find((item) => item.id === conversation.id)?.unreadCount, 0);
      await data(await call("POST", `/conversations/${conversation.id}/messages`, tokens[receiver], { body: "Reply" }), 201);
      const senderView = await data<{ messages: { body: string }[] }>(await call("GET", `/conversations/${conversation.id}`, tokens[sender]), 200);
      assert.equal(senderView.messages.at(-1)?.body, "Reply");
      const outsider = [0,1,2,3,4,5].find((i) => i !== sender && i !== receiver)!;
      assert.equal((await call("GET", `/conversations/${conversation.id}`, tokens[outsider])).status, 404);
      assert.equal((await call("POST", `/conversations/${conversation.id}/messages`, tokens[outsider], { body: "intrusion" })).status, 404);
      assert.equal(await prisma.notification.count({ where: { userId: ids[receiver], conversationId: conversation.id, notificationType: "message" } }), 1);
      if (sender === 0 && receiver === 1) {
        const bytes = Buffer.from("Example document");
        const upload = (token: string) => fetch(`${base}/conversations/${conversation.id}/attachments`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream", "X-File-Name": "example.txt" }, body: bytes });
        assert.equal((await upload(tokens[outsider])).status, 404);
        await data(await upload(tokens[sender]), 201);
        const withFile = await data<{ messages: { attachments?: { id: string; filename: string }[] }[] }>(await call("GET", `/conversations/${conversation.id}`, tokens[receiver]), 200);
        const attachment = withFile.messages.flatMap((message) => message.attachments ?? []).find((item) => item.filename === "example.txt"); assert.ok(attachment);
        assert.equal((await call("GET", `/attachments/${attachment.id}`, tokens[outsider])).status, 404);
        const download = await call("GET", `/attachments/${attachment.id}`, tokens[receiver]); assert.equal(download.status, 200); assert.equal(await download.text(), "Example document");
      }
      for (const media of ["audio", "video"]) {
        const callId = randomUUID();
        const offer = { callId, kind: "offer", media, payload: { type: "offer", sdp: "test-offer" } };
        assert.equal((await call("POST", `/conversations/${conversation.id}/call-signals`, tokens[outsider], offer)).status, 404);
        await data(await call("POST", `/conversations/${conversation.id}/call-signals`, tokens[sender], offer), 202);
        const pending = await data<{ call: { conversationId: string; fromUserId: string } | null }>(await call("GET", "/incoming-call", tokens[receiver]), 200);
        assert.equal(pending.call?.conversationId, conversation.id); assert.equal(pending.call?.fromUserId, ids[sender]);
        const signals = await data<{ signals: { kind: string; callId: string }[] }>(await call("GET", `/conversations/${conversation.id}/call-signals?after=0`, tokens[receiver]), 200);
        assert.ok(signals.signals.some((signal) => signal.callId === callId && signal.kind === "offer"));
        const kind = media === "audio" ? "end" : "answer";
        await data(await call("POST", `/conversations/${conversation.id}/call-signals`, tokens[receiver], { callId, kind, media, payload: kind === "answer" ? { type: "answer", sdp: "test-answer" } : null }), 202);
        const response = await data<{ signals: { kind: string; callId: string }[] }>(await call("GET", `/conversations/${conversation.id}/call-signals?after=0`, tokens[sender]), 200);
        assert.ok(response.signals.some((signal) => signal.callId === callId && signal.kind === kind));
        if (kind === "answer") await data(await call("POST", `/conversations/${conversation.id}/call-signals`, tokens[sender], { callId, kind: "end", media, payload: null }), 202);
        assert.equal((await data<{ call: unknown }>(await call("GET", "/incoming-call", tokens[receiver]), 200)).call, null);
        const recorded = await prisma.message.findUniqueOrThrow({ where: { id: callId } });
        assert.equal(recorded.messageType, media === "audio" ? "call_declined_audio" : "call_ended_video");
      }
      if (sender === 0 && receiver === 1) {
        const missedId = randomUUID();
        await data(await call("POST", `/conversations/${conversation.id}/call-signals`, tokens[sender], { callId: missedId, kind: "offer", media: "video", payload: { type: "offer", sdp: "test-offer" } }), 202);
        await data(await call("POST", `/conversations/${conversation.id}/call-signals`, tokens[sender], { callId: missedId, kind: "end", media: "video", payload: null }), 202);
        await data(await call("POST", `/conversations/${conversation.id}/call-signals`, tokens[sender], { callId: missedId, kind: "end", media: "video", payload: null }), 202);
        assert.equal((await prisma.message.findUniqueOrThrow({ where: { id: missedId } })).body, "Missed video call");
        assert.equal(await prisma.notification.count({ where: { userId: ids[receiver], conversationId: conversation.id, notificationType: "missed_call" } }), 1);
        const timedOut = randomUUID();
        await data(await call("POST", `/conversations/${conversation.id}/call-signals`, tokens[sender], { callId: timedOut, kind: "offer", media: "audio", payload: { type: "offer", sdp: "test-offer" } }), 202);
        await prisma.message.update({ where: { id: timedOut }, data: { sentAt: new Date(Date.now() - 31_000) } });
        await new PrismaCallHistoryRepository().expire(conversation.id);
        assert.equal((await prisma.message.findUniqueOrThrow({ where: { id: timedOut } })).body, "Missed audio call");
        assert.equal(await prisma.notification.count({ where: { userId: ids[receiver], conversationId: conversation.id, notificationType: "missed_call" } }), 2);
      }
    }
  } finally {
    server.close();
    const files = await prisma.messageAttachment.findMany({ where: { message: { conversationId: { in: conversationIds } } }, select: { storageKey: true } });
    for (const file of files) await unlink(resolve(process.env.CHAT_STORAGE_ROOT || "./storage/chat-attachments", file.storageKey)).catch(() => {});
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.conversation.deleteMany({ where: { id: { in: conversationIds } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  }
});
