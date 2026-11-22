import { prisma } from "../../../infrastructure/database/prisma-client.js";
import { PUBLISHED_CONTENT_STATUS } from "../application/public-content-policy.js";
import type { PublicPage, PublicPageRepository } from "../application/get-public-page.usecase.js";

export class PrismaPublicPagesRepository implements PublicPageRepository {
  constructor(private readonly database = prisma) {}
  async findPublishedPageBySlug(slug: string, now: Date): Promise<PublicPage | null> {
    const row = await this.database.page.findFirst({
      where: { slug, status: PUBLISHED_CONTENT_STATUS, publishedAt: { not: null, lte: now } },
      select: { id: true, slug: true, title: true, content: true, publishedAt: true },
    });
    return row ? { id: row.id, slug: row.slug, title: row.title, content: row.content, publishedAt: row.publishedAt!.toISOString() } : null;
  }
}
