import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { PublicEntryKind, PublicWebsiteEntriesRepository } from "../application/get-public-website-entries.usecase.js";
const select = { slug: true, title: true, summary: true, content: true, publishedAt: true } as const;
export class PrismaPublicWebsiteEntriesRepository implements PublicWebsiteEntriesRepository {
  constructor(private readonly database = prisma) {}
  async list(kind: PublicEntryKind, now: Date) {
    const rows = await this.database.websiteEntry.findMany({ where: { kind, status: "published", publishedAt: { not: null, lte: now } }, select, orderBy: [{ publishedAt: "desc" }, { id: "asc" }], take: 100 });
    return rows.map(row => ({ ...row, publishedAt: row.publishedAt!.toISOString() }));
  }
  async get(kind: PublicEntryKind, slug: string, now: Date) {
    const row = await this.database.websiteEntry.findFirst({ where: { kind, slug, status: "published", publishedAt: { not: null, lte: now } }, select });
    return row ? { ...row, publishedAt: row.publishedAt!.toISOString() } : null;
  }
  async media(id: string, now: Date) { return this.database.websiteMedia.findFirst({ where: { id, status: "published", publishedAt: { not: null, lte: now } }, select: { data: true, contentType: true } }); }
}
