import { prisma } from "../../../infrastructure/database/prisma-client.js";
import { enrollmentBlock, isCurrentCompletion, progressionFor, progressionSelect, type ProgressionEnrollment } from "../../programme-progression/progression.js";
import { assessProgress } from "../../programme-progression/progress-policy.js";
import type {
  AdminCohortsPage,
  AdminProgrammesPage,
  AdminProgrammesRepository,
  AssignableProgrammeStaff,
  AssignmentRole,
  CohortDetail,
  CohortFilter,
  CohortListRow,
  CohortParticipant,
  CohortStatus,
  CohortWrite,
  EnrollmentStatus,
  ProgrammeDetail,
  ProgrammeFields,
  ProgrammeFilter,
  ProgrammeListRow,
  ProgrammeStatus,
  ProgrammeSummary,
  ProgrammeStaffAssignment,
  ProgrammeWrite,
  ParticipantProgressFilter,
  ParticipantProgressPage,
} from "../domain/admin-programmes.repository.js";

const day = (value: Date | null) => value?.toISOString().slice(0, 10) ?? null;
const date = (value: string | null) => value ? new Date(`${value}T00:00:00.000Z`) : null;
const enrolledStatuses = ["enrolled", "completed"] as const;
const pathwayCodes = new Set(["TGE-FOUNDATION", "TGE-YOUNG-ENTREPRENEUR", "TGE-THE-ENTREPRENEUR"]);
const enrollmentStatus = (value: string): EnrollmentStatus | "unrecognized" =>
  value === "enrolled" || value === "completed" || value === "withdrawn" ? value : "unrecognized";

function participantRecord(row: {
  id: string; memberId: string; status: string; enrolledAt: Date; completedAt: Date | null;
  cohort: ProgressionEnrollment["cohort"]; progress: ProgressionEnrollment["progress"];
  member: { user: { firstName: string; lastName: string; email: string; phone: string | null } };
}): CohortParticipant {
  return { enrollmentId: row.id, memberId: row.memberId, name: [row.member.user.firstName, row.member.user.lastName].filter(Boolean).join(" "), email: row.member.user.email, phone: row.member.user.phone, status: enrollmentStatus(row.status), enrolledAt: row.enrolledAt.toISOString(), completedAt: row.completedAt?.toISOString() ?? null, completionNeedsReview: row.status === "completed" && !isCurrentCompletion(row) };
}

function assignmentRecord(row: {
  id: string;
  userId: string;
  assignmentRole: string;
  status: string;
  assignedAt: Date;
  user: { firstName: string; lastName: string; email: string };
}): ProgrammeStaffAssignment {
  return {
    id: row.id,
    userId: row.userId,
    name: [row.user.firstName, row.user.lastName].filter(Boolean).join(" "),
    email: row.user.email,
    assignmentRole: row.assignmentRole,
    status: row.status,
    assignedAt: row.assignedAt.toISOString(),
  };
}

function programmeFields(row: {
  code: string | null; name: string; slug: string; description: string | null; programmeType: string | null;
  targetAudience: string | null; durationWeeks: number | null; deliveryMode: string | null; coverImageUrl: string | null;
  learningObjectives: string[]; programContent: string[]; eligibility: string | null; startDate: Date | null; endDate: Date | null;
}): ProgrammeFields {
  return { code: row.code, name: row.name, slug: row.slug, description: row.description, programmeType: row.programmeType, targetAudience: row.targetAudience, durationWeeks: row.durationWeeks, deliveryMode: row.deliveryMode, coverImageUrl: row.coverImageUrl, learningObjectives: row.learningObjectives, programContent: row.programContent, eligibility: row.eligibility, startDate: day(row.startDate), endDate: day(row.endDate) };
}

function summaryShape(totalProgrammes: number, totalCohorts: number, enrollments: Array<{ memberId: string; status: string }>): ProgrammeSummary {
  const enrolledMemberIds = new Set(enrollments.filter(({ status }) => status === "enrolled").map(({ memberId }) => memberId));
  const completedMemberIds = new Set(enrollments.filter(({ status }) => status === "completed").map(({ memberId }) => memberId));
  return { totalProgrammes, totalCohorts, enrolledMembers: enrolledMemberIds.size, completedMembers: completedMemberIds.size };
}

export class PrismaAdminProgrammesRepository implements AdminProgrammesRepository {
  async createCoverImage(title: string, contentType: string, data: Uint8Array, actorUserId: string): Promise<string> {
    const media = await prisma.$transaction(async (tx) => {
      const image = await tx.websiteMedia.create({ data: { title, contentType, data: Uint8Array.from(data), createdByUserId: actorUserId, status: "published", publishedAt: new Date() }, select: { id: true } });
      await tx.auditLog.create({ data: { actorUserId, action: "ADMIN_PROGRAMME_COVER_UPLOADED", entityType: "WebsiteMedia", entityId: image.id } });
      return image;
    });
    return `/api/public/website-media/${media.id}`;
  }
  async listAssignableStaff(): Promise<AssignableProgrammeStaff[]> {
    const users = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        role: { is: { name: { in: ["Mentor", "Trainer / Facilitator"] } } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: { id: true, firstName: true, lastName: true, email: true, role: { select: { name: true } } },
    });
    return users.flatMap((user) => {
      const assignmentRole: AssignmentRole | null = user.role.name === "Mentor"
        ? "mentor"
        : user.role.name === "Trainer / Facilitator"
          ? "trainer"
          : null;
      return assignmentRole ? [{
        id: user.id,
        name: [user.firstName, user.lastName].filter(Boolean).join(" "),
        email: user.email,
        assignmentRole,
      }] : [];
    });
  }

  private async summary(): Promise<ProgrammeSummary> {
    const [totalProgrammes, totalCohorts, enrollments] = await Promise.all([
      prisma.programme.count(), prisma.cohort.count(), prisma.enrollment.findMany({ where: { status: { in: [...enrolledStatuses] } }, select: { memberId: true, status: true } }),
    ]);
    return summaryShape(totalProgrammes, totalCohorts, enrollments);
  }

  async listProgrammes(filter: ProgrammeFilter): Promise<AdminProgrammesPage> {
    const search = filter.search?.trim();
    const where = { ...(filter.status ? { status: filter.status } : {}), ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { code: { contains: search, mode: "insensitive" as const } }, { description: { contains: search, mode: "insensitive" as const } }] } : {}) };
    const [total, rows, summary] = await Promise.all([
      prisma.programme.count({ where }),
      prisma.programme.findMany({ where, orderBy: [{ createdAt: "desc" }, { name: "asc" }], skip: (filter.page - 1) * filter.pageSize, take: filter.pageSize,
        select: { id: true, code: true, name: true, slug: true, description: true, programmeType: true, targetAudience: true, durationWeeks: true, deliveryMode: true, coverImageUrl: true, learningObjectives: true, programContent: true, eligibility: true, startDate: true, endDate: true, status: true, cohorts: { select: { id: true } } },
      }),
      this.summary(),
    ]);
    const cohortProgramme = new Map<string, string>();
    for (const programme of rows) for (const cohort of programme.cohorts) cohortProgramme.set(cohort.id, programme.id);
    const cohortIds = [...cohortProgramme.keys()];
    const enrollments = cohortIds.length ? await prisma.enrollment.findMany({ where: { cohortId: { in: cohortIds }, status: { in: [...enrolledStatuses] } }, select: { cohortId: true, memberId: true, status: true } }) : [];
    const counts = new Map<string, { enrolled: Set<string>; completed: Set<string> }>();
    for (const item of enrollments) {
      const programmeId = cohortProgramme.get(item.cohortId);
      if (!programmeId) continue;
      const value = counts.get(programmeId) ?? { enrolled: new Set<string>(), completed: new Set<string>() };
      value[item.status === "completed" ? "completed" : "enrolled"].add(item.memberId);
      counts.set(programmeId, value);
    }
    const data: ProgrammeListRow[] = rows.map((row) => {
      const cohortStats = counts.get(row.id) ?? { enrolled: new Set<string>(), completed: new Set<string>() };
      return { id: row.id, ...programmeFields(row), status: row.status as ProgrammeStatus, cohortCount: row.cohorts.length, enrolledCount: cohortStats.enrolled.size, completedCount: cohortStats.completed.size };
    });
    return { summary, rows: data, total, page: filter.page, pageSize: filter.pageSize };
  }

  async listCohorts(filter: CohortFilter): Promise<AdminCohortsPage> {
    const search = filter.search?.trim();
    const where = { ...(filter.status ? { status: filter.status } : {}), ...(filter.programmeId ? { programmeId: filter.programmeId } : {}), ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { programme: { name: { contains: search, mode: "insensitive" as const } } }] } : {}) };
    const [total, rows, summary] = await Promise.all([
      prisma.cohort.count({ where }),
      prisma.cohort.findMany({ where, orderBy: [{ startDate: "desc" }, { name: "asc" }], skip: (filter.page - 1) * filter.pageSize, take: filter.pageSize, select: { id: true, programmeId: true, name: true, startDate: true, endDate: true, capacity: true, status: true, programme: { select: { name: true } } } }),
      this.summary(),
    ]);
    const ids = rows.map(({ id }) => id);
    const enrollments = ids.length ? await prisma.enrollment.findMany({ where: { cohortId: { in: ids }, status: { in: [...enrolledStatuses] } }, select: { cohortId: true, status: true } }) : [];
    const counts = new Map<string, { enrolled: number; completed: number }>();
    for (const item of enrollments) {
      const value = counts.get(item.cohortId) ?? { enrolled: 0, completed: 0 };
      value[item.status === "completed" ? "completed" : "enrolled"] += 1;
      counts.set(item.cohortId, value);
    }
    return { summary, total, page: filter.page, pageSize: filter.pageSize, rows: rows.map((row) => ({ id: row.id, programmeId: row.programmeId, programmeName: row.programme.name, name: row.name, startDate: day(row.startDate)!, endDate: day(row.endDate), capacity: row.capacity, status: row.status as CohortStatus, enrolledCount: counts.get(row.id)?.enrolled ?? 0, completedCount: counts.get(row.id)?.completed ?? 0 })) };
  }

  async getProgramme(id: string): Promise<ProgrammeDetail | null> {
    const row = await prisma.programme.findUnique({ where: { id }, select: { id: true, code: true, name: true, slug: true, description: true, programmeType: true, targetAudience: true, durationWeeks: true, deliveryMode: true, coverImageUrl: true, learningObjectives: true, programContent: true, eligibility: true, startDate: true, endDate: true, status: true, cohorts: { orderBy: [{ startDate: "desc" }, { name: "asc" }], select: { id: true, programmeId: true, name: true, startDate: true, endDate: true, capacity: true, status: true, _count: { select: { enrollments: true } } } }, assignments: { orderBy: [{ status: "asc" }, { assignedAt: "asc" }], select: { id: true, userId: true, assignmentRole: true, status: true, assignedAt: true, user: { select: { firstName: true, lastName: true, email: true } } } } } });
    if (!row) return null;
    const all = await prisma.enrollment.findMany({ where: { cohortId: { in: row.cohorts.map(({ id: cohortId }) => cohortId) }, status: { in: [...enrolledStatuses] } }, select: { cohortId: true, memberId: true, status: true } });
    const stats = new Map<string, { enrolled: number; completed: number }>();
    const enrolledMemberIds = new Set<string>();
    const completedMemberIds = new Set<string>();
    for (const item of all) {
      const current = stats.get(item.cohortId) ?? { enrolled: 0, completed: 0 };
      if (item.status === "completed") { current.completed += 1; completedMemberIds.add(item.memberId); }
      else { current.enrolled += 1; enrolledMemberIds.add(item.memberId); }
      stats.set(item.cohortId, current);
    }
    const cohorts: CohortListRow[] = row.cohorts.map((cohort) => ({ id: cohort.id, programmeId: row.id, programmeName: row.name, name: cohort.name, startDate: day(cohort.startDate)!, endDate: day(cohort.endDate), capacity: cohort.capacity, status: cohort.status as CohortStatus, enrolledCount: stats.get(cohort.id)?.enrolled ?? 0, completedCount: stats.get(cohort.id)?.completed ?? 0 }));
    return { id: row.id, ...programmeFields(row), status: row.status as ProgrammeStatus, cohortCount: cohorts.length, enrolledCount: enrolledMemberIds.size, completedCount: completedMemberIds.size, cohorts, assignments: row.assignments.map(assignmentRecord) };
  }

  async createProgramme(input: ProgrammeWrite, actorUserId: string): Promise<ProgrammeDetail> {
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.programme.create({ data: { ...input, startDate: date(input.startDate), endDate: date(input.endDate), status: "published" }, select: { id: true } });
      await tx.auditLog.create({ data: { actorUserId, action: "ADMIN_PROGRAMME_CREATED", entityType: "Programme", entityId: created.id, details: { status: "published" } } });
      return created;
    });
    return (await this.getProgramme(row.id))!;
  }

  async updateProgramme(id: string, input: ProgrammeWrite, actorUserId: string): Promise<ProgrammeDetail | null> {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM programmes WHERE id = ${id}::uuid FOR UPDATE`;
      const current = await tx.programme.findUnique({ where: { id }, select: { id: true, code: true, status: true, cohorts: { select: { name: true, startDate: true, endDate: true, _count: { select: { enrollments: true } } } } } });
      if (!current) return false;
      if (current.status === "archived") throw new Error("PROGRAMME_ARCHIVED");
      if (current.code && pathwayCodes.has(current.code) && input.code !== current.code) throw new Error("PROGRAMME_PATHWAY_FIXED");
      if (input.code !== current.code && current.cohorts.some((cohort) => cohort._count.enrollments > 0)) throw new Error("PROGRAMME_PATHWAY_HAS_HISTORY");
      for (const cohort of current.cohorts) {
        if ((input.startDate && cohort.startDate < date(input.startDate)!) || (input.endDate && cohort.startDate > date(input.endDate)!) || (input.startDate && cohort.endDate && cohort.endDate < date(input.startDate)!) || (input.endDate && cohort.endDate && cohort.endDate > date(input.endDate)!)) throw new Error("PROGRAMME_DATES_CONFLICT_WITH_COHORTS");
      }
      await tx.programme.update({ where: { id }, data: { ...input, startDate: date(input.startDate), endDate: date(input.endDate) } });
      await tx.auditLog.create({ data: { actorUserId, action: "ADMIN_PROGRAMME_UPDATED", entityType: "Programme", entityId: id, details: { status: current.status } } });
      return true;
    });
    return updated ? this.getProgramme(id) : null;
  }

  async transitionProgramme(id: string, expectedStatus: ProgrammeStatus, status: ProgrammeStatus, actorUserId: string): Promise<ProgrammeDetail | null> {
    await prisma.$transaction(async (tx) => {
      const changed = await tx.programme.updateMany({ where: { id, status: expectedStatus }, data: { status } });
      if (changed.count !== 1) throw new Error("PROGRAMME_STATUS_CHANGED");
      await tx.auditLog.create({ data: { actorUserId, action: status === "published" ? "ADMIN_PROGRAMME_PUBLISHED" : "ADMIN_PROGRAMME_ARCHIVED", entityType: "Programme", entityId: id, details: { previousStatus: expectedStatus, status } } });
    });
    return this.getProgramme(id);
  }

  async assignProgrammeStaff(programmeId: string, userId: string, role: AssignmentRole, actorUserId: string): Promise<ProgrammeDetail | null> {
    const roleName = role === "mentor" ? "Mentor" : "Trainer / Facilitator";
    const assignment = await prisma.$transaction(async (tx) => {
      const programme = await tx.programme.findUnique({ where: { id: programmeId }, select: { id: true, status: true } });
      if (!programme) return null;
      if (programme.status === "archived") throw new Error("PROGRAMME_ARCHIVED");
      const eligible = await tx.user.findFirst({ where: { id: userId, status: "ACTIVE", deletedAt: null, role: { is: { name: roleName } } }, select: { id: true } });
      if (!eligible) throw new Error("ASSIGNEE_NOT_ELIGIBLE");
      const assigned = await tx.programmeAssignment.upsert({
        where: { programmeId_userId_assignmentRole: { programmeId, userId, assignmentRole: role } },
        update: { status: "active", assignedAt: new Date() },
        create: { programmeId, userId, assignmentRole: role, status: "active" },
        select: { id: true },
      });
      await tx.auditLog.create({ data: { actorUserId, action: "ADMIN_PROGRAMME_STAFF_ASSIGNED", entityType: "ProgrammeAssignment", entityId: assigned.id, details: { programmeId, userId, assignmentRole: role } } });
      return assigned;
    });
    return assignment ? this.getProgramme(programmeId) : null;
  }

  async deactivateProgrammeStaff(programmeId: string, assignmentId: string, actorUserId: string): Promise<ProgrammeDetail | null> {
    const assignment = await prisma.$transaction(async (tx) => {
      const current = await tx.programmeAssignment.findFirst({ where: { id: assignmentId, programmeId }, select: { id: true, userId: true, assignmentRole: true, status: true } });
      if (!current) return null;
      if (current.status !== "active") throw new Error("ASSIGNMENT_NOT_ACTIVE");
      await tx.programmeAssignment.update({ where: { id: assignmentId }, data: { status: "inactive" } });
      await tx.auditLog.create({ data: { actorUserId, action: "ADMIN_PROGRAMME_STAFF_UNASSIGNED", entityType: "ProgrammeAssignment", entityId: current.id, details: { programmeId, userId: current.userId, assignmentRole: current.assignmentRole, previousStatus: current.status, status: "inactive" } } });
      return current;
    });
    return assignment ? this.getProgramme(programmeId) : null;
  }

  async createCohort(programmeId: string, input: CohortWrite, actorUserId: string): Promise<CohortDetail | null> {
    const programme = await prisma.programme.findUnique({ where: { id: programmeId }, select: { id: true, status: true, startDate: true, endDate: true } });
    if (!programme) return null;
    if (programme.status === "archived") throw new Error("PROGRAMME_ARCHIVED");
    if ((programme.startDate && input.endDate && date(input.endDate)! < programme.startDate) || (programme.startDate && date(input.startDate)! < programme.startDate) || (programme.endDate && date(input.startDate)! > programme.endDate) || (programme.endDate && input.endDate && date(input.endDate)! > programme.endDate)) throw new Error("COHORT_DATES_OUTSIDE_PROGRAMME");
    const created = await prisma.$transaction(async (tx) => {
      const cohort = await tx.cohort.create({ data: { programmeId, name: input.name, startDate: date(input.startDate)!, endDate: date(input.endDate), capacity: input.capacity, status: "planned" }, select: { id: true } });
      await tx.auditLog.create({ data: { actorUserId, action: "ADMIN_COHORT_CREATED", entityType: "Cohort", entityId: cohort.id, details: { programmeId, status: "planned" } } });
      return cohort;
    });
    return this.getCohort(created.id);
  }

  async getCohort(id: string): Promise<CohortDetail | null> {
    const row = await prisma.cohort.findUnique({ where: { id }, select: { id: true, programmeId: true, name: true, startDate: true, endDate: true, capacity: true, status: true, programme: { select: { name: true, status: true, code: true } }, enrollments: { orderBy: [{ enrolledAt: "desc" }, { id: "asc" }], select: { ...progressionSelect, id: true, memberId: true, status: true, enrolledAt: true, completedAt: true, member: { select: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } } } }, assignments: { orderBy: [{ status: "asc" }, { assignedAt: "asc" }], select: { id: true, userId: true, assignmentRole: true, status: true, assignedAt: true, user: { select: { firstName: true, lastName: true, email: true } } } } } });
    if (!row) return null;
    const participants = row.enrollments.map((enrollment) => participantRecord(enrollment));
    return { id: row.id, programmeId: row.programmeId, programmeName: row.programme.name, programmeCode: row.programme.code, programmeStatus: row.programme.status as ProgrammeStatus, name: row.name, startDate: day(row.startDate)!, endDate: day(row.endDate), capacity: row.capacity, status: row.status as CohortStatus, enrolledCount: participants.filter(({ status }) => status === "enrolled").length, completedCount: participants.filter(({ status }) => status === "completed").length, participants, assignments: row.assignments.map(assignmentRecord) };
  }

  async listParticipantProgress(cohortId: string, filter: ParticipantProgressFilter): Promise<ParticipantProgressPage | null> {
    const cohort = await prisma.cohort.findUnique({ where: { id: cohortId }, select: { id: true, programmeId: true, name: true, status: true, programme: { select: { name: true } } } });
    if (!cohort) return null;
    const search = filter.search?.trim();
    const memberFilter = search ? {
      member: {
        is: {
          user: {
            is: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" as const } },
                { lastName: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
              ],
            },
          },
        },
      },
    } : {};
    const where = { cohortId, ...(filter.status ? { status: filter.status } : {}), ...memberFilter };
    const [total, enrollments, grouped] = await Promise.all([
      prisma.enrollment.count({ where }),
      prisma.enrollment.findMany({ where, orderBy: [{ enrolledAt: "desc" }, { id: "asc" }], skip: (filter.page - 1) * filter.pageSize, take: filter.pageSize, select: { ...progressionSelect, id: true, memberId: true, status: true, enrolledAt: true, completedAt: true, member: { select: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } } } }),
      prisma.enrollment.groupBy({ by: ["status"], where: { cohortId }, _count: { _all: true } }),
    ]);
    const summary = { totalParticipants: grouped.reduce((n, r) => n + r._count._all, 0), enrolled: 0, completed: 0, withdrawn: 0, unrecognized: 0 };
    for (const group of grouped) {
      if (group.status === "enrolled") summary.enrolled = group._count._all;
      if (group.status === "completed") summary.completed = group._count._all;
      if (group.status === "withdrawn") summary.withdrawn = group._count._all;
      if (group.status !== "enrolled" && group.status !== "completed" && group.status !== "withdrawn") summary.unrecognized += group._count._all;
    }
    return { cohort: { id: cohort.id, programmeId: cohort.programmeId, programmeName: cohort.programme.name, name: cohort.name, status: cohort.status as CohortStatus }, summary, rows: enrollments.map(participantRecord), total, page: filter.page, pageSize: filter.pageSize };
  }

  async updateCohort(id: string, input: CohortWrite, actorUserId: string): Promise<CohortDetail | null> {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM cohorts WHERE id = ${id}::uuid FOR UPDATE`;
      const current = await tx.cohort.findUnique({ where: { id }, select: { id: true, programmeId: true, status: true, programme: { select: { status: true, startDate: true, endDate: true } }, enrollments: { where: { status: "enrolled" }, select: { id: true } } } });
      if (!current) return false;
      if (current.status === "archived" || current.programme.status === "archived") throw new Error("COHORT_ARCHIVED");
      if (input.capacity !== null && input.capacity < current.enrollments.length) throw new Error("CAPACITY_BELOW_ENROLLMENT");
      if ((current.programme.startDate && input.endDate && date(input.endDate)! < current.programme.startDate) || (current.programme.startDate && date(input.startDate)! < current.programme.startDate) || (current.programme.endDate && date(input.startDate)! > current.programme.endDate) || (current.programme.endDate && input.endDate && date(input.endDate)! > current.programme.endDate)) throw new Error("COHORT_DATES_OUTSIDE_PROGRAMME");
      await tx.cohort.update({ where: { id }, data: { name: input.name, startDate: date(input.startDate)!, endDate: date(input.endDate), capacity: input.capacity } });
      await tx.auditLog.create({ data: { actorUserId, action: "ADMIN_COHORT_UPDATED", entityType: "Cohort", entityId: id, details: { programmeId: current.programmeId, enrolledCount: current.enrollments.length } } });
      return true;
    });
    return updated ? this.getCohort(id) : null;
  }

  async transitionCohort(id: string, expectedStatus: CohortStatus, status: CohortStatus, actorUserId: string): Promise<CohortDetail | null> {
    const current = await prisma.cohort.findUnique({ where: { id }, select: { programme: { select: { status: true } } } });
    if (!current) return null;
    if (current.programme.status === "archived") throw new Error("COHORT_ARCHIVED");
    await prisma.$transaction(async (tx) => {
      const changed = await tx.cohort.updateMany({ where: { id, status: expectedStatus }, data: { status } });
      if (changed.count !== 1) throw new Error("COHORT_STATUS_CHANGED");
      await tx.auditLog.create({ data: { actorUserId, action: "ADMIN_COHORT_STATUS_CHANGED", entityType: "Cohort", entityId: id, details: { previousStatus: expectedStatus, status } } });
    });
    return this.getCohort(id);
  }

  async assignCohortStaff(cohortId: string, userId: string, role: AssignmentRole, actorUserId: string): Promise<CohortDetail | null> {
    const roleName = role === "mentor" ? "Mentor" : "Trainer / Facilitator";
    const assignment = await prisma.$transaction(async (tx) => {
      const cohort = await tx.cohort.findUnique({ where: { id: cohortId }, select: { id: true, status: true, programme: { select: { status: true } } } });
      if (!cohort) return null;
      if (cohort.status === "archived" || cohort.programme.status === "archived") throw new Error("COHORT_ARCHIVED");
      const eligible = await tx.user.findFirst({ where: { id: userId, status: "ACTIVE", deletedAt: null, role: { is: { name: roleName } } }, select: { id: true } });
      if (!eligible) throw new Error("ASSIGNEE_NOT_ELIGIBLE");
      const assigned = await tx.cohortAssignment.upsert({
        where: { cohortId_userId_assignmentRole: { cohortId, userId, assignmentRole: role } },
        update: { status: "active", assignedAt: new Date() },
        create: { cohortId, userId, assignmentRole: role, status: "active" },
        select: { id: true },
      });
      await tx.auditLog.create({ data: { actorUserId, action: "ADMIN_COHORT_STAFF_ASSIGNED", entityType: "CohortAssignment", entityId: assigned.id, details: { cohortId, userId, assignmentRole: role } } });
      return assigned;
    });
    return assignment ? this.getCohort(cohortId) : null;
  }

  async deactivateCohortStaff(cohortId: string, assignmentId: string, actorUserId: string): Promise<CohortDetail | null> {
    const assignment = await prisma.$transaction(async (tx) => {
      const current = await tx.cohortAssignment.findFirst({ where: { id: assignmentId, cohortId }, select: { id: true, userId: true, assignmentRole: true, status: true } });
      if (!current) return null;
      if (current.status !== "active") throw new Error("ASSIGNMENT_NOT_ACTIVE");
      await tx.cohortAssignment.update({ where: { id: assignmentId }, data: { status: "inactive" } });
      await tx.auditLog.create({ data: { actorUserId, action: "ADMIN_COHORT_STAFF_UNASSIGNED", entityType: "CohortAssignment", entityId: current.id, details: { cohortId, userId: current.userId, assignmentRole: current.assignmentRole, previousStatus: current.status, status: "inactive" } } });
      return current;
    });
    return assignment ? this.getCohort(cohortId) : null;
  }

  async enrollMember(cohortId: string, memberId: string, actorUserId: string, feeId?: string | null): Promise<CohortParticipant> {
    const created = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('tge_progression_policy')::bigint)`;
      await tx.$queryRaw`SELECT id FROM cohorts WHERE id = ${cohortId}::uuid FOR UPDATE`;
      const parent = await tx.cohort.findUnique({ where: { id: cohortId }, select: { programmeId: true } });
      if (!parent) throw new Error("COHORT_NOT_FOUND");
      await tx.$queryRaw`SELECT id FROM programmes WHERE id = ${parent.programmeId}::uuid FOR UPDATE`;
      const cohort = await tx.cohort.findUnique({ where: { id: cohortId }, select: { id: true, capacity: true, status: true, programme: { select: { status: true, code: true } }, _count: { select: { enrollments: { where: { status: "enrolled" } } } } } });
      if (!cohort) throw new Error("COHORT_NOT_FOUND");
      if (cohort.programme.status !== "published" || !["planned", "upcoming", "ongoing"].includes(cohort.status)) throw new Error("COHORT_NOT_OPEN_FOR_ENROLLMENT");
      if (cohort.capacity !== null && cohort._count.enrollments >= cohort.capacity) throw new Error("COHORT_CAPACITY_REACHED");
      const member = await tx.member.findFirst({ where: { id: memberId, membershipStatus: "active", user: { is: { deletedAt: null, status: "ACTIVE" } } }, select: { id: true, userId: true } });
      if (!member) throw new Error("MEMBER_NOT_ELIGIBLE");
      await tx.$queryRaw`SELECT id FROM members WHERE id = ${memberId}::uuid FOR UPDATE`;
      const records = await tx.enrollment.findMany({ where: { memberId, status: "completed" }, select: progressionSelect });
      const block = enrollmentBlock(cohort.programme.code, progressionFor(records));
      if (block) throw new Error(block);
      const enrollment = await tx.enrollment.create({ data: { memberId, cohortId, status: "enrolled" }, select: { ...progressionSelect, id: true, memberId: true, status: true, enrolledAt: true, completedAt: true, member: { select: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } } } });
      if (cohort.programme.code === "TGE-FOUNDATION") {
        const configured = await tx.cohortRegistrationFee.findUnique({ where: { cohortId }, include: { fee: true } });
        const selectedFeeId = feeId === undefined ? configured?.feeId ?? null : feeId;
        const fee = selectedFeeId ? await tx.feeDefinition.findUnique({ where: { id: selectedFeeId } }) : null;
        if (selectedFeeId && !fee) throw new Error("FOUNDATION_FEE_INVALID");
        if (fee && (!fee.active || fee.category !== "programme" || fee.programmeId !== parent.programmeId || !["member", "all"].includes(fee.audience))) throw new Error("FOUNDATION_FEE_INVALID");
        let chargeId: string | null = null;
        if (fee && fee.amountMinor > 0) { const charge = await tx.memberCharge.create({ data: { feeId: fee.id, memberId, periodKey: `cohort:${cohortId}`, feeName: fee.name, amountMinor: fee.amountMinor, currency: fee.currency, createdByUserId: actorUserId } }); chargeId = charge.id; }
        await tx.programmeRegistrationRequest.upsert({ where: { memberId_cohortId: { memberId, cohortId } }, create: { memberId, cohortId, status: "approved", reviewedById: actorUserId, reviewedAt: new Date(), chargeId }, update: { status: "approved", reason: null, reviewedById: actorUserId, reviewedAt: new Date(), chargeId } });
        await tx.notification.create({ data: { userId: member.userId, title: "Foundation registration", body: "An administrator enrolled you in a Foundation cohort.", notificationType: "programme" } });
      }
      await tx.auditLog.create({ data: { actorUserId, action: "ADMIN_MEMBER_ENROLLED", entityType: "Enrollment", entityId: enrollment.id, details: { memberId, cohortId } } });
      return enrollment;
    });
    return participantRecord(created);
  }

  async findEnrollment(enrollmentId: string): Promise<{ status: EnrollmentStatus } | null> {
    const row = await prisma.enrollment.findUnique({ where: { id: enrollmentId }, select: { status: true } });
    return row ? { status: row.status as EnrollmentStatus } : null;
  }

  async transitionEnrollment(enrollmentId: string, expectedStatus: EnrollmentStatus, status: EnrollmentStatus, actorUserId: string): Promise<CohortParticipant | null> {
    const current = await prisma.enrollment.findUnique({ where: { id: enrollmentId }, select: { id: true, memberId: true, cohortId: true, status: true } });
    if (!current) return null;
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('tge_progression_policy')::bigint)`;
      await tx.$queryRaw`SELECT id FROM members WHERE id = ${current.memberId}::uuid FOR UPDATE`;
      if (status === "completed") {
        const row = await tx.enrollment.findUniqueOrThrow({ where: { id: enrollmentId }, select: { progress: true, cohort: { select: { progressRevision: true, progressPolicy: true, programme: { select: { progressPolicy: true } } } } } });
        const policy = row.cohort.progressPolicy ?? row.cohort.programme.progressPolicy;
        const assessment = assessProgress(policy, row.cohort.progressPolicy ? "cohort" : policy ? "programme" : null, row.progress, row.cohort.progressRevision);
        if (!assessment.configured) throw new Error("REQUIREMENTS_NOT_CONFIGURED");
        if (!assessment.requirementsMet) throw new Error("COMPLETION_REQUIREMENTS_NOT_MET");
        await tx.enrollmentProgress.upsert({ where: { enrollmentId }, create: { enrollmentId, approvedPolicyKey: assessment.policyKey }, update: { approvedPolicyKey: assessment.policyKey } });
      }
      const changed = await tx.enrollment.updateMany({ where: { id: enrollmentId, status: expectedStatus }, data: { status, ...(status === "completed" && expectedStatus === "completed" ? {} : { completedAt: status === "completed" ? new Date() : null }) } });
      if (changed.count !== 1) throw new Error("ENROLLMENT_STATUS_CHANGED");
      await tx.auditLog.create({ data: { actorUserId, action: status === "completed" ? "ADMIN_ENROLLMENT_COMPLETED" : "ADMIN_ENROLLMENT_WITHDRAWN", entityType: "Enrollment", entityId: enrollmentId, details: { previousStatus: expectedStatus, status } } });
    });
    const row = await prisma.enrollment.findUnique({ where: { id: enrollmentId }, select: { ...progressionSelect, id: true, memberId: true, status: true, enrolledAt: true, completedAt: true, member: { select: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } } } });
    return row ? participantRecord(row) : null;
  }
}
