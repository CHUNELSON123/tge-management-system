import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type {
  AdminDashboardData,
  AdminDashboardDateRange,
  AdminDashboardRepository,
} from "../domain/admin-dashboard.repository.js";

const activityWindow = (range: AdminDashboardDateRange) => ({ createdAt: { gte: range.from, lt: range.toExclusive } });

export class PrismaAdminDashboardRepository implements AdminDashboardRepository {
  async loadDashboard(range: AdminDashboardDateRange): Promise<AdminDashboardData> {
    const [totalMemberProfiles, memberAccountStatusGroups, publishedProgrammes, mentors, trainers, publishedEventsInRange, publiclyListedBusinesses, programmes, activities, upcomingEvents, growthRows] = await Promise.all([
      prisma.member.count({ where: { user: { deletedAt: null } } }),
      Promise.all(([
        "ACTIVE",
        "PENDING_ACTIVATION",
        "SUSPENDED",
        "DEACTIVATED",
      ] as const).map(async (status) => ({
        status,
        count: await prisma.user.count({
          where: { status, deletedAt: null, memberProfile: { isNot: null } },
        }),
      }))),
      prisma.programme.count({ where: { status: "published" } }),
      prisma.mentor.findMany({
        where: { status: "active", user: { status: "ACTIVE", deletedAt: null } },
        select: { userId: true },
      }),
      prisma.user.findMany({
        where: { status: "ACTIVE", deletedAt: null, role: { name: "Trainer / Facilitator" } },
        select: { id: true },
      }),
      prisma.event.count({
        where: { status: "published", startAt: { gte: range.from, lt: range.toExclusive } },
      }),
      prisma.business.count({ where: { status: "active", publicationStatus: "approved" } }),
      prisma.programme.findMany({
        where: { status: "published" },
        select: { id: true, name: true, cohorts: { select: { id: true } } },
        orderBy: [{ name: "asc" }, { id: "asc" }],
      }),
      Promise.all([
        prisma.member.findMany({ where: { ...activityWindow(range), user: { deletedAt: null } }, select: { id: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 8 }),
        prisma.membershipApplication.findMany({ where: activityWindow(range), select: { id: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 8 }),
        prisma.programme.findMany({ where: activityWindow(range), select: { id: true, name: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 8 }),
        prisma.event.findMany({ where: activityWindow(range), select: { id: true, title: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 8 }),
        prisma.resource.findMany({ where: activityWindow(range), select: { id: true, title: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 8 }),
        prisma.business.findMany({ where: activityWindow(range), select: { id: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 8 }),
        prisma.enrollment.findMany({ where: activityWindow(range), select: { id: true, createdAt: true, cohort: { select: { name: true, programme: { select: { name: true } } } } }, orderBy: { createdAt: "desc" }, take: 8 }),
      ]),
      prisma.event.findMany({
        where: { status: "published", startAt: { gte: new Date() } },
        select: { id: true, title: true, startAt: true, timezone: true, venue: true },
        orderBy: [{ startAt: "asc" }, { id: "asc" }],
        take: 3,
      }),
      prisma.$queryRaw<Array<{ month: string; joined: number }>>`
        SELECT TO_CHAR(DATE_TRUNC('month', m.joined_at AT TIME ZONE 'UTC'), 'YYYY-MM') AS month,
               COUNT(*)::integer AS joined
        FROM members AS m
        INNER JOIN users AS u ON u.id = m.user_id
        WHERE m.joined_at >= ${range.from}
          AND m.joined_at < ${range.toExclusive}
          AND u.deleted_at IS NULL
        GROUP BY 1
        ORDER BY 1
      `,
    ]);

    const memberCountsByStatus = memberAccountStatusGroups;

    const cohortIdsByProgramme = new Map<string, string[]>();
    const allCohortIds: string[] = [];
    for (const programme of programmes) {
      const cohortIds = programme.cohorts.map(({ id }) => id);
      cohortIdsByProgramme.set(programme.id, cohortIds);
      allCohortIds.push(...cohortIds);
    }
    const enrollmentGroups = allCohortIds.length === 0 ? [] : await prisma.enrollment.groupBy({
      by: ["cohortId"],
      where: { cohortId: { in: allCohortIds }, status: "enrolled" },
      _count: { _all: true },
    });
    const enrollmentCountByCohort = new Map(enrollmentGroups.map(({ cohortId, _count }) => [cohortId, _count._all]));
    const programmeParticipation = programmes.map((programme) => ({
      programmeId: programme.id,
      programmeName: programme.name,
      enrolledParticipants: (cohortIdsByProgramme.get(programme.id) ?? []).reduce((count, cohortId) => count + (enrollmentCountByCohort.get(cohortId) ?? 0), 0),
    }));

    const [membersCreated, applicationsCreated, programmesCreated, eventsCreated, resourcesCreated, businessesCreated, enrollmentsCreated] = activities;
    const recentActivity: AdminDashboardData["recentActivity"] = [
      ...membersCreated.map(({ id, createdAt }) => ({ id: `member:${id}`, kind: "member-created", subject: null, occurredAt: createdAt.toISOString() })),
      ...applicationsCreated.map(({ id, createdAt }) => ({ id: `application:${id}`, kind: "application-received", subject: null, occurredAt: createdAt.toISOString() })),
      ...programmesCreated.map(({ id, name, createdAt }) => ({ id: `programme:${id}`, kind: "programme-created", subject: name, occurredAt: createdAt.toISOString() })),
      ...eventsCreated.map(({ id, title, createdAt }) => ({ id: `event:${id}`, kind: "event-created", subject: title, occurredAt: createdAt.toISOString() })),
      ...resourcesCreated.map(({ id, title, createdAt }) => ({ id: `resource:${id}`, kind: "resource-created", subject: title, occurredAt: createdAt.toISOString() })),
      ...businessesCreated.map(({ id, createdAt }) => ({ id: `business:${id}`, kind: "business-created", subject: null, occurredAt: createdAt.toISOString() })),
      ...enrollmentsCreated.map(({ id, cohort, createdAt }) => ({ id: `enrollment:${id}`, kind: "participant-enrolled", subject: `${cohort.programme.name} · ${cohort.name}`, occurredAt: createdAt.toISOString() })),
    ].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)).slice(0, 8);

    return {
      dateRange: {
        from: range.from.toISOString().slice(0, 10),
        to: new Date(range.toExclusive.getTime() - 86_400_000).toISOString().slice(0, 10),
      },
      summary: {
        totalMemberProfiles,
        publishedProgrammes,
        activeMentorsAndTrainers: new Set([...mentors.map(({ userId }) => userId), ...trainers.map(({ id }) => id)]).size,
        publishedEventsInRange,
        publiclyListedBusinesses,
      },
      memberCountsByStatus,
      memberGrowth: growthRows,
      programmeParticipation,
      recentActivity,
      upcomingEvents: upcomingEvents.map(({ id, title, startAt, timezone, venue }) => ({ id, title, startAt: startAt.toISOString(), timezone, venue })),
    };
  }
}
