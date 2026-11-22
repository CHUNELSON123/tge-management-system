import test from "node:test";
import assert from "node:assert/strict";
import { GetPublicEventsUseCase, type PublicEventRecord, type PublicEventsRepository } from "./get-public-events.usecase.js";

const event = (id: string, startAt: string): PublicEventRecord => ({
  id,
  title: `Event ${id}`,
  eventType: "workshop",
  description: null,
  startAt,
  endAt: null,
  timezone: null,
  venue: null,
});

test("public events are separated into chronological upcoming and reverse-chronological past lists", async () => {
  const repository: PublicEventsRepository = {
    listPublishedEvents: async () => [
      event("future-late", "2026-11-05T10:00:00.000Z"),
      event("past-old", "2026-10-01T10:00:00.000Z"),
      event("future-soon", "2026-11-03T11:00:00.000Z"),
      event("past-recent", "2026-11-01T10:00:00.000Z"),
    ],
    findPublishedEventById: async () => null,
    listRelatedPublishedEvents: async () => [],
  };

  const result = await new GetPublicEventsUseCase(repository).execute(new Date("2026-11-03T10:00:00.000Z"));

  assert.deepEqual(result.upcoming.map(({ id }) => id), ["future-soon", "future-late"]);
  assert.deepEqual(result.past.map(({ id }) => id), ["past-recent", "past-old"]);
});
