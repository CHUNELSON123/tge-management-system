import test from "node:test";
import assert from "node:assert/strict";
import { GetPublicNewsDetailsUseCase, GetPublicNewsUseCase, type PublicNewsRepository } from "./get-public-news.usecase.js";

const article = { id: "a1", slug: "news-item", title: "Public title", summary: "Summary", content: "Article content", publishedAt: "2026-11-01T10:00:00.000Z" };

test("public news use cases delegate list and slug detail requests", async () => {
  const calls: unknown[][] = [];
  const repository: PublicNewsRepository = {
    listPublishedNews: async (now) => { calls.push(["list", now]); return [article]; },
    findPublishedNewsBySlug: async (slug, now) => { calls.push(["detail", slug, now]); return slug === article.slug ? article : null; },
  };
  const now = new Date("2026-11-04T00:00:00.000Z");
  assert.deepEqual(await new GetPublicNewsUseCase(repository).execute(now), [article]);
  assert.deepEqual(await new GetPublicNewsDetailsUseCase(repository).execute(article.slug, now), article);
  assert.deepEqual(await new GetPublicNewsDetailsUseCase(repository).execute("draft", now), null);
  assert.equal(calls.length, 3);
});
