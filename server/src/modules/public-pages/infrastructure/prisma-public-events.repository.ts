import { prisma } from "../../../infrastructure/database/prisma-client.js";
import { PUBLISHED_CONTENT_STATUS } from "../application/public-content-policy.js";
import type { PublicEventRecord, PublicEventsRepository } from "../application/get-public-events.usecase.js";

const publicEventFields = {
  id: true,
  title: true,
  eventType: true,
  description: true,
  startAt: true,
  endAt: true,
  timezone: true,
  venue: true,
} as const;

function toPublicEventRecord(event: {
  id: string;
  title: string;
  eventType: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  timezone: string | null;
  venue: string | null;
}): PublicEventRecord {
  return {
    id: event.id,
    title: event.title,
    eventType: event.eventType,
    description: event.description,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt?.toISOString() ?? null,
    timezone: event.timezone,
    venue: event.venue,
  };
}

export class PrismaPublicEventsRepository implements PublicEventsRepository {
  constructor(private readonly database = prisma) {}

  async listPublishedEvents(): Promise<PublicEventRecord[]> {
    const events = await this.database.event.findMany({
      where: { status: PUBLISHED_CONTENT_STATUS },
      orderBy: { startAt: "asc" },
      select: publicEventFields,
    });
    return events.map(toPublicEventRecord);
  }

  async findPublishedEventById(eventId: string): Promise<PublicEventRecord | null> {
    const event = await this.database.event.findFirst({
      where: { id: eventId, status: PUBLISHED_CONTENT_STATUS },
      select: publicEventFields,
    });
    return event ? toPublicEventRecord(event) : null;
  }

  async listRelatedPublishedEvents(eventId: string, eventType: string, now: Date, limit: number): Promise<PublicEventRecord[]> {
    const events = await this.database.event.findMany({
      where: {
        id: { not: eventId },
        eventType,
        status: PUBLISHED_CONTENT_STATUS,
        startAt: { gte: now },
      },
      orderBy: { startAt: "asc" },
      take: limit,
      select: publicEventFields,
    });
    return events.map(toPublicEventRecord);
  }

  async listApprovedGalleryItems() {
    return this.database.eventMedia.findMany({
      where: {
        approvedAt: { not: null },
        publicUrl: { not: null },
        event: { status: PUBLISHED_CONTENT_STATUS },
      },
      select: { id: true, eventId: true, publicUrl: true, altText: true, caption: true, event: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    }).then((items) => items.flatMap((item) => {
      if (!item.publicUrl || !item.altText || !/^https:\/\//i.test(item.publicUrl)) return [];
      return [{ id: item.id, eventId: item.eventId, eventTitle: item.event.title, url: item.publicUrl, altText: item.altText }];
    }));
  }
}
