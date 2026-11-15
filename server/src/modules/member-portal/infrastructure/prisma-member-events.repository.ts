import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { MemberEventDetails, MemberEventRecord, MemberEventsRepository } from "../domain/member-events.repository.js";

function toRecord(event: {
  id: string; title: string; eventType: string; description: string | null; startAt: Date; endAt: Date | null;
  timezone: string | null; venue: string | null; registrations?: Array<{ registrationStatus: string; registeredAt: Date }>;
}): MemberEventRecord {
  const registration = event.registrations?.[0];
  return {
    id: event.id,
    title: event.title,
    eventType: event.eventType,
    description: event.description,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt?.toISOString() ?? null,
    timezone: event.timezone,
    venue: event.venue,
    registrationStatus: registration?.registrationStatus ?? null,
    registeredAt: registration?.registeredAt.toISOString() ?? null,
  };
}

export class PrismaMemberEventsRepository implements MemberEventsRepository {
  constructor(private readonly database = prisma) {}

  async listForMember(userId: string): Promise<MemberEventRecord[] | null> {
    const member = await this.database.member.findUnique({ where: { userId }, select: { id: true } });
    if (!member) return null;
    const events = await this.database.event.findMany({
      where: {
        status: "published",
        registrations: { some: { memberId: member.id, registrationStatus: "registered", cancelledAt: null } },
      },
      orderBy: [{ startAt: "asc" }, { id: "asc" }],
      select: {
        id: true, title: true, eventType: true, description: true, startAt: true, endAt: true, timezone: true, venue: true,
        registrations: { where: { memberId: member.id, registrationStatus: "registered", cancelledAt: null }, orderBy: { registeredAt: "desc" }, take: 1, select: { registrationStatus: true, registeredAt: true } },
      },
    });
    return events.map(toRecord);
  }

  async findAccessibleEvent(userId: string, eventId: string, now: Date): Promise<MemberEventDetails | null> {
    const member = await this.database.member.findUnique({ where: { userId }, select: { id: true } });
    if (!member) return null;
    const event = await this.database.event.findFirst({
      where: { id: eventId, status: "published" },
      select: {
        id: true, title: true, eventType: true, description: true, startAt: true, endAt: true, timezone: true, venue: true,
        registrations: { where: { memberId: member.id, cancelledAt: null }, orderBy: { registeredAt: "desc" }, take: 1, select: { registrationStatus: true, registeredAt: true } },
      },
    });
    if (!event) return null;
    return { ...toRecord(event), isUpcoming: event.startAt.getTime() >= now.getTime() };
  }
}
