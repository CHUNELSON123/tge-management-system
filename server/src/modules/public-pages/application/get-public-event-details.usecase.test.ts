import test from "node:test";
import assert from "node:assert/strict";
import { GetPublicEventDetailsUseCase } from "./get-public-event-details.usecase.js";
import type { PublicEventsRepository } from "./get-public-events.usecase.js";

test("public event detail includes only its public event fields and related events", async () => {
  let relatedCalls = 0;
  const event = { id: "event-1", title: "Workshop", eventType: "workshop", description: "Open description", startAt: "2026-11-05T10:00:00.000Z", endAt: null, timezone: null, venue: "Public venue" };
  const repository: PublicEventsRepository = {
    listPublishedEvents: async () => [],
    findPublishedEventById: async () => event,
    listRelatedPublishedEvents: async (id, type, now, limit) => {
      relatedCalls += 1;
      assert.equal(id, event.id);
      assert.equal(type, event.eventType);
      assert.equal(limit, 3);
      return [];
    },
  };

  const result = await new GetPublicEventDetailsUseCase(repository).execute(event.id, new Date("2026-11-03T10:00:00.000Z"));

  assert.deepEqual(result, { ...event, isUpcoming: true, relatedEvents: [] });
  assert.equal(relatedCalls, 1);
});

test("non-public or missing events return no public detail", async () => {
  let relatedCalls = 0;
  const repository: PublicEventsRepository = {
    listPublishedEvents: async () => [],
    findPublishedEventById: async () => null,
    listRelatedPublishedEvents: async () => { relatedCalls += 1; return []; },
  };

  const result = await new GetPublicEventDetailsUseCase(repository).execute("private-event");
  assert.equal(result, null);
  assert.equal(relatedCalls, 0);
});
