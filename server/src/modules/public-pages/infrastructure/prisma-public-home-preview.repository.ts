import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { PublicHomePreviewRepository, PublicPreviewItem } from "../application/get-home-previews.usecase.js";
import { ACTIVE_BUSINESS_STATUS, APPROVED_BUSINESS_PUBLICATION_STATUS, PUBLISHED_CONTENT_STATUS } from "../application/public-content-policy.js";
import type { PublicProgrammeRecord, PublicProgrammeRepository } from "../application/get-public-programmes.usecase.js";

export class PrismaPublicHomePreviewRepository implements PublicHomePreviewRepository, PublicProgrammeRepository {
  constructor(private readonly database = prisma) {}

  async listProgrammes(limit: number): Promise<PublicPreviewItem[]> {
    const records = await this.database.programme.findMany({
      where: { status: PUBLISHED_CONTENT_STATUS },
      orderBy: { startDate: "asc" },
      take: limit,
      select: { name: true, slug: true, description: true, startDate: true },
    });
    return records.map((record) => ({
      title: record.name,
      href: "/programmes",
      summary: record.description,
      date: record.startDate?.toISOString() ?? null,
    }));
  }

  async listPublishedProgrammes(): Promise<PublicProgrammeRecord[]> {
    const records = await this.database.programme.findMany({
      where: { status: PUBLISHED_CONTENT_STATUS },
      orderBy: { name: "asc" },
      select: { name: true, slug: true, description: true, startDate: true, endDate: true },
    });
    return records.map((record) => ({
      name: record.name,
      slug: record.slug,
      description: record.description,
      startDate: record.startDate?.toISOString() ?? null,
      endDate: record.endDate?.toISOString() ?? null,
    }));
  }

  async listUpcomingEvents(limit: number, now: Date): Promise<PublicPreviewItem[]> {
    const records = await this.database.event.findMany({
      where: { status: PUBLISHED_CONTENT_STATUS, startAt: { gte: now } },
      orderBy: { startAt: "asc" },
      take: limit,
      select: { id: true, title: true, description: true, eventType: true, startAt: true },
    });
    return records.map((record) => ({
      title: record.title,
      href: "/events",
      summary: record.description,
      date: record.startAt.toISOString(),
      category: record.eventType,
    }));
  }

  async listApprovedBusinesses(limit: number): Promise<PublicPreviewItem[]> {
    const records = await this.database.business.findMany({
      where: { status: ACTIVE_BUSINESS_STATUS, publicationStatus: APPROVED_BUSINESS_PUBLICATION_STATUS },
      orderBy: { name: "asc" },
      take: limit,
      select: { name: true, slug: true, description: true },
    });
    return records.map((record) => ({
      title: record.name,
      href: "/business-directory",
      summary: record.description,
    }));
  }

  async listPublishedNews(limit: number, now: Date): Promise<PublicPreviewItem[]> {
    const records = await this.database.news.findMany({
      where: { status: PUBLISHED_CONTENT_STATUS, publishedAt: { lte: now } },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: { title: true, slug: true, summary: true, publishedAt: true },
    });
    return records.map((record) => ({
      title: record.title,
      href: "/news",
      summary: record.summary,
      date: record.publishedAt?.toISOString() ?? null,
    }));
  }
}
