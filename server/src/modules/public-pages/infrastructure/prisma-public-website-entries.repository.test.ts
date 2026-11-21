import test from "node:test";
import assert from "node:assert/strict";
import { PrismaPublicWebsiteEntriesRepository } from "./prisma-public-website-entries.repository.js";

test("public entry and media queries enforce publication status and dates", async () => {
  const calls: Array<Record<string, unknown>> = [];
  const db = {
    websiteEntry: {
      findMany: async (args: Record<string, unknown>) => { calls.push(args); return []; },
      findFirst: async (args: Record<string, unknown>) => { calls.push(args); return null; },
    },
    websiteMedia: { findFirst: async (args: Record<string, unknown>) => { calls.push(args); return null; } },
  };
  const repo = new PrismaPublicWebsiteEntriesRepository(db as never);
  const now = new Date("2026-11-13T12:00:00Z");
  await repo.list("faq", now);
  await repo.get("blog", "example", now);
  await repo.media("image-id", now);
  for (const call of calls) {
    const where = call.where as Record<string, unknown>;
    assert.equal(where.status, "published");
    assert.deepEqual(where.publishedAt, { not: null, lte: now });
  }
  assert.equal((calls[0].where as Record<string, unknown>).kind, "faq");
  assert.equal((calls[1].where as Record<string, unknown>).slug, "example");
});

