import test from "node:test";
import assert from "node:assert/strict";
import { PrismaPublicHomePreviewRepository } from "./prisma-public-home-preview.repository.js";

test("public Home queries enforce visibility filters and select only public fields", async () => {
  const calls: Array<{ model: string; args: Record<string, unknown> }> = [];
  const database = Object.fromEntries(["programme", "event", "business", "news"].map((model) => [model, {
    findMany: async (args: Record<string, unknown>) => {
      calls.push({ model, args });
      return [];
    },
  }])) as never;
  const repository = new PrismaPublicHomePreviewRepository(database);
  const now = new Date("2026-11-02T00:00:00.000Z");

  await Promise.all([
    repository.listProgrammes(3),
    repository.listUpcomingEvents(3, now),
    repository.listApprovedBusinesses(3),
    repository.listPublishedNews(3, now),
  ]);

  const callFor = (model: string) => calls.find((call) => call.model === model)!;
  assert.deepEqual(callFor("programme").args.where, { status: "published" });
  assert.deepEqual(callFor("event").args.where, { status: "published", startAt: { gte: now } });
  assert.deepEqual(callFor("business").args.where, { status: "active", publicationStatus: "approved" });
  assert.deepEqual(callFor("news").args.where, { status: "published", publishedAt: { lte: now } });
  assert.deepEqual(callFor("business").args.select, { name: true, slug: true, description: true });
  assert.deepEqual(callFor("news").args.select, { title: true, slug: true, summary: true, publishedAt: true });
  assert.ok(calls.every((call) => call.args.take === 3));
});

test("public programme browse query excludes cohorts and selects only public programme fields", async () => {
  let query: Record<string, unknown> | undefined;
  const database = {
    programme: {
      findMany: async (args: Record<string, unknown>) => {
        query = args;
        return [{ name: "Published programme", slug: "published-programme", description: "Public description", startDate: null, endDate: null }];
      },
    },
  } as never;
  const records = await new PrismaPublicHomePreviewRepository(database).listPublishedProgrammes();

  assert.deepEqual(query?.where, { status: "published" });
  assert.deepEqual(query?.select, { name: true, slug: true, description: true, startDate: true, endDate: true });
  assert.deepEqual(records, [{ name: "Published programme", slug: "published-programme", description: "Public description", startDate: null, endDate: null }]);
  assert.equal(JSON.stringify(query).includes("cohort"), false);
});
