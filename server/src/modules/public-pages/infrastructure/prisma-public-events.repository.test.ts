import test from "node:test";
import assert from "node:assert/strict";
import { PrismaPublicEventsRepository } from "./prisma-public-events.repository.js";

test("public event listing filters published events and selects a public field allowlist", async () => {
  let query: Record<string, unknown> | undefined;
  const database = { event: { findMany: async (args: Record<string, unknown>) => { query = args; return []; } } } as never;

  await new PrismaPublicEventsRepository(database).listPublishedEvents();

  assert.deepEqual(query?.where, { status: "published" });
  assert.deepEqual(query?.select, {
    id: true, title: true, eventType: true, description: true, startAt: true, endAt: true, timezone: true, venue: true,
  });
  assert.equal(JSON.stringify(query).includes("registration"), false);
  assert.equal(JSON.stringify(query).includes("createdByUserId"), false);
});

test("event details require a published record and do not select attendee or operational fields", async () => {
  let query: Record<string, unknown> | undefined;
  const database = { event: { findFirst: async (args: Record<string, unknown>) => { query = args; return null; } } } as never;

  const event = await new PrismaPublicEventsRepository(database).findPublishedEventById("00000000-0000-4000-8000-000000000000");

  assert.equal(event, null);
  assert.deepEqual(query?.where, { id: "00000000-0000-4000-8000-000000000000", status: "published" });
  assert.equal(JSON.stringify(query).includes("meetingUrl"), false);
  assert.equal(JSON.stringify(query).includes("capacity"), false);
});
