import { prisma } from "../../../../infrastructure/database/prisma-client.js";
import type { MentorEventsRepository } from "../../domain/repositories/mentor-events.repository.js";
export class PrismaMentorEventsRepository implements MentorEventsRepository {
  async list(userId: string) {
    const rows = await prisma.event.findMany({ where: { OR: [{ status: "published" }, { createdByUserId: userId }, { staffAssignments: { some: { userId } } }] }, orderBy: { startAt: "asc" }, select: { id: true, title: true, shortDescription: true, eventType: true, startAt: true, endAt: true, venue: true, eventMode: true, status: true, createdByUserId: true, staffAssignments: { where: { userId }, select: { id: true } }, _count: { select: { registrations: { where: { registrationStatus: { not: "cancelled" } } } } } } });
    return rows.map(({ staffAssignments, createdByUserId, _count, ...event }) => ({ ...event, isAssigned: createdByUserId === userId || staffAssignments.length > 0, registeredCount: _count.registrations }));
  }
}
