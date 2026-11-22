import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { AdminReportRange, AdminReportsData, AdminReportsRepository } from "../domain/admin-reports.repository.js";
type Group = { status: string; _count: { _all: number } };
const countGroups = (rows: Group[]) => rows.map(({ status, _count }) => ({ status, count: _count._all }));
function completeMonthBuckets(rows: Array<{ month: string; count: number }>, range: AdminReportRange) {
  const values = new Map(rows.map((row) => [row.month, row.count]));
  const cursor = new Date(range.from); cursor.setUTCDate(1);
  const end = new Date(range.toExclusive.getTime() - 1); end.setUTCDate(1);
  const buckets: Array<{ month: string; count: number }> = [];
  while (cursor <= end) { const month = cursor.toISOString().slice(0, 7); buckets.push({ month, count: values.get(month) ?? 0 }); cursor.setUTCMonth(cursor.getUTCMonth() + 1); }
  return buckets;
}

export class PrismaAdminReportsRepository implements AdminReportsRepository {
  async load(range: AdminReportRange): Promise<AdminReportsData> {
    const [totalUsers, userRegistrations, programmeEnrollments, programmeCompletions, memberProfiles, activeMemberAccounts, publishedProgrammes, activeMentorshipAssignments, activeApprovedBusinesses, publishedEventsInRange, memberAccountsByStatus, memberJoinsByMonth, programmesByStatus, enrollmentsByStatusInRange, eventsByStatus, eventRegistrationGroups, mentoringSessionGroups, mentoringObjectiveGroups, businessesByStatus, pageGroups, newsGroups, entryGroups, mediaGroups] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.$queryRaw<Array<{ month: string; count: number }>>`SELECT TO_CHAR(DATE_TRUNC('month', created_at AT TIME ZONE 'UTC'), 'YYYY-MM') AS month, COUNT(*)::integer AS count FROM users WHERE created_at >= ${range.from} AND created_at < ${range.toExclusive} AND deleted_at IS NULL GROUP BY 1 ORDER BY 1`,
      prisma.$queryRaw<Array<{ month: string; count: number }>>`SELECT TO_CHAR(DATE_TRUNC('month', enrolled_at AT TIME ZONE 'UTC'), 'YYYY-MM') AS month, COUNT(*)::integer AS count FROM enrollments WHERE enrolled_at >= ${range.from} AND enrolled_at < ${range.toExclusive} GROUP BY 1 ORDER BY 1`,
      prisma.$queryRaw<Array<{ month: string; count: number }>>`SELECT TO_CHAR(DATE_TRUNC('month', completed_at AT TIME ZONE 'UTC'), 'YYYY-MM') AS month, COUNT(*)::integer AS count FROM enrollments WHERE completed_at >= ${range.from} AND completed_at < ${range.toExclusive} GROUP BY 1 ORDER BY 1`,
      prisma.member.count({ where: { user: { deletedAt: null } } }),
      prisma.user.count({ where: { status: "ACTIVE", deletedAt: null, memberProfile: { isNot: null } } }),
      prisma.programme.count({ where: { status: "published" } }),
      prisma.mentorAssignment.count({ where: { status: "active" } }),
      prisma.business.count({ where: { status: "active", publicationStatus: "approved" } }),
      prisma.event.count({ where: { status: "published", startAt: { gte: range.from, lt: range.toExclusive } } }),
      Promise.all((["ACTIVE", "PENDING_ACTIVATION", "SUSPENDED", "DEACTIVATED"] as const).map(async (status) => ({ status, count: await prisma.user.count({ where: { status, deletedAt: null, memberProfile: { isNot: null } } }) }))),
      prisma.$queryRaw<Array<{ month: string; count: number }>>`SELECT TO_CHAR(DATE_TRUNC('month', m.joined_at AT TIME ZONE 'UTC'), 'YYYY-MM') AS month, COUNT(*)::integer AS count FROM members m INNER JOIN users u ON u.id = m.user_id WHERE m.joined_at >= ${range.from} AND m.joined_at < ${range.toExclusive} AND u.deleted_at IS NULL GROUP BY 1 ORDER BY 1`,
      prisma.programme.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
      prisma.enrollment.groupBy({ by: ["status"], where: { enrolledAt: { gte: range.from, lt: range.toExclusive } }, _count: { _all: true }, orderBy: { status: "asc" } }),
      prisma.event.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
      prisma.eventRegistration.groupBy({ by: ["registrationStatus"], where: { registeredAt: { gte: range.from, lt: range.toExclusive } }, _count: { _all: true }, orderBy: { registrationStatus: "asc" } }),
      prisma.mentoringSession.groupBy({ by: ["status"], where: { scheduledStart: { gte: range.from, lt: range.toExclusive } }, _count: { _all: true }, orderBy: { status: "asc" } }),
      prisma.mentoringObjective.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
      prisma.business.groupBy({ by: ["status", "publicationStatus"], _count: { _all: true }, orderBy: [{ status: "asc" }, { publicationStatus: "asc" }] }),
      prisma.page.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
      prisma.news.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
      prisma.websiteEntry.groupBy({ by: ["kind", "status"], _count: { _all: true }, orderBy: [{ kind: "asc" }, { status: "asc" }] }),
      prisma.websiteMedia.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
    ]);
    return {
      range: { from: range.from.toISOString().slice(0, 10), to: new Date(range.toExclusive.getTime() - 86400000).toISOString().slice(0, 10), timezone: "UTC" },
      snapshot: { totalUsers, memberProfiles, activeMemberAccounts, publishedProgrammes, activeMentorshipAssignments, activeApprovedBusinesses, publishedEventsInRange },
      userRegistrationsByMonth: completeMonthBuckets(userRegistrations, range),
      programmeEnrollmentsByMonth: completeMonthBuckets(programmeEnrollments, range),
      programmeCompletionsByMonth: completeMonthBuckets(programmeCompletions, range),
      memberAccountsByStatus, memberJoinsByMonth: completeMonthBuckets(memberJoinsByMonth, range),
      programmesByStatus: countGroups(programmesByStatus), enrollmentsByStatusInRange: countGroups(enrollmentsByStatusInRange),
      eventsByStatus: countGroups(eventsByStatus), eventRegistrationsByStatusInRange: eventRegistrationGroups.map(({ registrationStatus: status, _count }) => ({ status, count: _count._all })),
      mentoringSessionsByStatusInRange: countGroups(mentoringSessionGroups), mentoringObjectivesByStatus: countGroups(mentoringObjectiveGroups),
      businessesByStatus: businessesByStatus.map(({ status, publicationStatus, _count }) => ({ operationalStatus: status, publicationStatus, count: _count._all })),
      websiteContentByStatus: [...pageGroups.map(({ status, _count }) => ({ type: "page", status, count: _count._all })), ...newsGroups.map(({ status, _count }) => ({ type: "news", status, count: _count._all })), ...entryGroups.map(({ kind, status, _count }) => ({ type: kind, status, count: _count._all })), ...mediaGroups.map(({ status, _count }) => ({ type: "media", status, count: _count._all }))],
    };
  }
  async recordExport(actorId: string, range: AdminReportRange): Promise<void> {
    await prisma.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_REPORT_EXPORTED", entityType: "Report", details: { from: range.from.toISOString(), toExclusive: range.toExclusive.toISOString(), format: "csv" } } });
  }
}
