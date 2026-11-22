import test from "node:test";
import assert from "node:assert/strict";
import { PrismaPublicNewsRepository } from "./prisma-public-news.repository.js";

test("public news queries require published status and a reached publication date and select no author fields", async () => {
  let listArgs: Record<string, unknown> | undefined;
  let detailArgs: Record<string, unknown> | undefined;
  const record = { id: "n1", slug: "public-news", title: "Title", summary: "Summary", content: "Body", publishedAt: new Date("2026-11-01T10:00:00Z") };
  const database = { news: {
    findMany: async (args: Record<string, unknown>) => { listArgs = args; return [record]; },
    findFirst: async (args: Record<string, unknown>) => { detailArgs = args; return record; },
  } } as never;
  const repository = new PrismaPublicNewsRepository(database);
  const now = new Date("2026-11-04T00:00:00Z");
  const list = await repository.listPublishedNews(now);
  const detail = await repository.findPublishedNewsBySlug(record.slug, now);
  assert.equal(list[0].slug, record.slug);
  assert.equal(detail?.content, record.content);
  assert.deepEqual(listArgs?.where, { status: "published", publishedAt: { not: null, lte: now } });
  assert.deepEqual(detailArgs?.where, { slug: record.slug, status: "published", publishedAt: { not: null, lte: now } });
  assert.equal(JSON.stringify(listArgs?.select).includes("author"), false);
  assert.equal(JSON.stringify(listArgs?.select).includes("featuredImageKey"), false);
});
