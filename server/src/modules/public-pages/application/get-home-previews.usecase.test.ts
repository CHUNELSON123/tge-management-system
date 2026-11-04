import test from "node:test";
import assert from "node:assert/strict";
import { GetHomePreviewsUseCase, type PublicHomePreviewRepository } from "./get-home-previews.usecase.js";

test("home preview use case requests all four public sections with a bounded limit", async () => {
  const calls: string[] = [];
  const repository: PublicHomePreviewRepository = {
    listProgrammes: async (limit) => { calls.push(`programmes:${limit}`); return []; },
    listUpcomingEvents: async (limit) => { calls.push(`events:${limit}`); return []; },
    listApprovedBusinesses: async (limit) => { calls.push(`businesses:${limit}`); return []; },
    listPublishedNews: async (limit) => { calls.push(`news:${limit}`); return []; },
  };

  const result = await new GetHomePreviewsUseCase(repository).execute(new Date("2026-11-02T00:00:00.000Z"));

  assert.deepEqual(result, { programmes: [], events: [], businesses: [], news: [] });
  assert.deepEqual(calls.sort(), ["businesses:3", "events:3", "news:3", "programmes:3"]);
});
