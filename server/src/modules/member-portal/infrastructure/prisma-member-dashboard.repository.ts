import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type {
  MemberDashboardAnnouncement,
  MemberDashboardEvent,
  MemberDashboardIdentity,
  MemberDashboardProgramme,
  MemberDashboardRepository,
} from "../domain/member-dashboard.repository.js";

export class PrismaMemberDashboardRepository implements MemberDashboardRepository {
  constructor(private readonly database = prisma) {}

  async findIdentity(userId: string): Promise<MemberDashboardIdentity | null> {
    const user = await this.database.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        memberProfile: {
          select: {
            id: true,
            enrollments: {
              where: { status: "enrolled" },
              select: { cohortId: true, cohort: { select: { programmeId: true } } },
            },
          },
        },
      },
    });

    if (!user) return null;
    const displayName = [user.firstName, user.lastName].map((part) => part.trim()).filter(Boolean).join(" ") || null;
    return {
      displayName,
      memberId: user.memberProfile?.id ?? null,
      enrolledCohorts: user.memberProfile?.enrollments.map((enrollment) => ({
        cohortId: enrollment.cohortId,
        programmeId: enrollment.cohort.programmeId,
      })) ?? [],
    };
  }

  async countEnrolledProgrammes(memberId: string) {
    const records = await this.database.enrollment.findMany({
      where: { memberId, status: "enrolled" },
      select: { cohort: { select: { programmeId: true } } },
    });
    return new Set(records.map(({ cohort }) => cohort.programmeId)).size;
  }

  async listEnrolledProgrammes(memberId: string, limit: number): Promise<MemberDashboardProgramme[]> {
    const records = await this.database.enrollment.findMany({
      where: { memberId, status: "enrolled" },
      orderBy: [{ enrolledAt: "desc" }, { id: "asc" }],
      select: {
        id: true,
        enrolledAt: true,
        cohort: { select: { name: true, programme: { select: { id: true, name: true } } } },
      },
    });
    const uniqueProgrammes = new Map<string, MemberDashboardProgramme>();
    for (const record of records) {
      if (!uniqueProgrammes.has(record.cohort.programme.id)) {
        uniqueProgrammes.set(record.cohort.programme.id, {
          id: record.cohort.programme.id,
          name: record.cohort.programme.name,
          cohortName: record.cohort.name,
          enrolledAt: record.enrolledAt.toISOString(),
        });
      }
    }
    return [...uniqueProgrammes.values()].slice(0, limit);
  }

  countUpcomingEvents(memberId: string, now: Date) {
    return this.database.eventRegistration.count({
      where: {
        memberId,
        registrationStatus: "registered",
        cancelledAt: null,
        event: { status: "published", startAt: { gte: now } },
      },
    });
  }

  async listUpcomingEvents(memberId: string, now: Date, limit: number): Promise<MemberDashboardEvent[]> {
    const records = await this.database.eventRegistration.findMany({
      where: {
        memberId,
        registrationStatus: "registered",
        cancelledAt: null,
        event: { status: "published", startAt: { gte: now } },
      },
      orderBy: [{ event: { startAt: "asc" } }, { id: "asc" }],
      take: limit,
      select: {
        event: { select: { id: true, title: true, eventType: true, startAt: true, endAt: true, timezone: true, venue: true } },
      },
    });
    return records.map(({ event }) => ({
      id: event.id,
      title: event.title,
      eventType: event.eventType,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt?.toISOString() ?? null,
      timezone: event.timezone,
      venue: event.venue,
    }));
  }

  countUpcomingMentorshipSessions(memberId: string, now: Date) {
    return this.database.mentoringSession.count({
      where: {
        status: "scheduled",
        scheduledStart: { gte: now },
        assignment: { memberId, status: "active" },
      },
    });
  }

  countUnreadNotifications(userId: string) {
    return this.database.notification.count({ where: { userId, readAt: null } });
  }

  async listRecentAnnouncements(input: {
    memberId: string;
    roleId: string;
    cohortIds: string[];
    programmeIds: string[];
    now: Date;
    limit: number;
  }): Promise<MemberDashboardAnnouncement[]> {
    const audienceTargets = [
      { memberTargets: { some: { memberId: input.memberId } } },
      { roleTargets: { some: { roleId: input.roleId } } },
      ...(input.cohortIds.length ? [{ cohortTargets: { some: { cohortId: { in: input.cohortIds } } } }] : []),
      ...(input.programmeIds.length ? [{ programmeTargets: { some: { programmeId: { in: input.programmeIds } } } }] : []),
    ];
    const records = await this.database.announcement.findMany({
      where: {
        status: "published",
        publishedAt: { not: null, lte: input.now },
        archivedAt: null,
        OR: audienceTargets,
      },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: input.limit,
      select: { id: true, title: true, content: true, category: true, publishedAt: true },
    });
    return records.flatMap((record) => record.publishedAt ? [{
      id: record.id,
      title: record.title,
      content: record.content,
      category: record.category,
      publishedAt: record.publishedAt.toISOString(),
    }] : []);
  }
}
