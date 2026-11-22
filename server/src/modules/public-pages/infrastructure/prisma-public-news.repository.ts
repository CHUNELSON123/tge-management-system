import { prisma } from "../../../infrastructure/database/prisma-client.js";
import { PUBLISHED_CONTENT_STATUS } from "../application/public-content-policy.js";
import type { PublicNewsArticle, PublicNewsRepository } from "../application/get-public-news.usecase.js";

const publicNewsFields = { id: true, slug: true, title: true, summary: true, content: true, publishedAt: true } as const;

function toPublicArticle(record: { id: string; slug: string; title: string; summary: string | null; content: string; publishedAt: Date | null }): PublicNewsArticle {
  return { id: record.id, slug: record.slug, title: record.title, summary: record.summary, content: record.content, publishedAt: record.publishedAt!.toISOString() };
}

export class PrismaPublicNewsRepository implements PublicNewsRepository {
  constructor(private readonly database = prisma) {}
  async listPublishedNews(now: Date): Promise<PublicNewsArticle[]> {
    const records = await this.database.news.findMany({
      where: { status: PUBLISHED_CONTENT_STATUS, publishedAt: { not: null, lte: now } },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      select: publicNewsFields,
    });
    return records.map(toPublicArticle);
  }
  async findPublishedNewsBySlug(slug: string, now: Date): Promise<PublicNewsArticle | null> {
    const record = await this.database.news.findFirst({
      where: { slug, status: PUBLISHED_CONTENT_STATUS, publishedAt: { not: null, lte: now } },
      select: publicNewsFields,
    });
    return record ? toPublicArticle(record) : null;
  }
}
