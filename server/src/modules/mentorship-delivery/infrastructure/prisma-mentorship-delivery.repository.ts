import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { DeliveryActor, MentorshipDeliveryRepository, QuarterlyReportInput } from "../domain/mentorship-delivery.repository.js";

const access = (actor: DeliveryActor) => actor.role === "mentor" ? { mentor: { userId: actor.userId } } : actor.role === "member" ? { member: { userId: actor.userId } } : {};
const audit = (userId: string, action: string, entityType: string, entityId: string, assignmentId: string) => ({ actorUserId: userId, action, entityType, entityId, details: { assignmentId } });

export class PrismaMentorshipDeliveryRepository implements MentorshipDeliveryRepository {
  async detail(assignmentId: string, actor: DeliveryActor) {
    return prisma.mentorAssignment.findFirst({ where: { id: assignmentId, ...access(actor) }, select: {
      id: true, status: true, startDate: true, endDate: true, completedAt: true,
      member: { select: { user: { select: { firstName: true, lastName: true } } } },
      mentor: { select: { user: { select: { firstName: true, lastName: true } } } },
      programme: { select: { name: true } },
      objectives: { orderBy: { createdAt: "asc" }, select: { id: true, title: true, description: true, status: true, targetDate: true, progressRecords: { orderBy: { recordedAt: "desc" }, select: { id: true, progressNote: true, progressValue: true, recordedAt: true, recordedBy: { select: { firstName: true, lastName: true } } } } } },
      sessions: { orderBy: { scheduledStart: "desc" }, select: { id: true, title: true, scheduledStart: true, scheduledEnd: true, status: true, locationOrUrl: true, outcome: true } },
      reports: { orderBy: [{ year: "desc" }, { quarter: "desc" }], select: { id: true, year: true, quarter: true, summary: true, achievements: true, challenges: true, nextSteps: true, createdAt: true, updatedAt: true, author: { select: { firstName: true, lastName: true } } } },
    } });
  }
  async report(assignmentId: string, actor: DeliveryActor, input: QuarterlyReportInput) {
    if (actor.role === "member") return null;
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM mentor_assignments WHERE id = ${assignmentId}::uuid FOR UPDATE`;
      const assignment = await tx.mentorAssignment.findFirst({ where: { id: assignmentId, ...access(actor) }, select: { status: true, member: { select: { userId: true } } } });
      if (!assignment) return null;
      if (assignment.status !== "active") throw new Error("ASSIGNMENT_CLOSED");
      const { reportId, ...content } = input;
      const existing = await tx.mentorshipQuarterlyReport.findUnique({ where: { assignmentId_year_quarter: { assignmentId, year: input.year, quarter: input.quarter } }, select: { id: true } });
      if (existing && !reportId) throw new Error("REPORT_EXISTS");
      if (reportId && existing?.id !== reportId) throw new Error("REPORT_CHANGED");
      const report = existing ? await tx.mentorshipQuarterlyReport.update({ where: { id: existing.id }, data: { ...content, authoredByUserId: actor.userId } }) : await tx.mentorshipQuarterlyReport.create({ data: { assignmentId, ...content, authoredByUserId: actor.userId } });
      await tx.auditLog.create({ data: audit(actor.userId, "MENTORSHIP_QUARTERLY_REPORT_SAVED", "MentorshipQuarterlyReport", report.id, assignmentId) });
      await tx.notification.create({ data: { userId: assignment.member.userId, title: "Mentorship progress report", body: `Your mentorship report for Q${input.quarter} ${input.year} is available.`, notificationType: "mentorship" } });
      return report;
    });
  }
  async updateSession(sessionId: string, actor: DeliveryActor, status: "completed" | "cancelled", outcome: string | null) {
    if (actor.role === "member") return null;
    return prisma.$transaction(async tx => {
      const item = await tx.mentoringSession.findFirst({ where: { id: sessionId, assignment: access(actor) }, select: { assignmentId: true } });
      if (!item) return null;
      await tx.$queryRaw`SELECT id FROM mentor_assignments WHERE id = ${item.assignmentId}::uuid FOR UPDATE`;
      const session = await tx.mentoringSession.findFirst({ where: { id: sessionId, assignment: access(actor) }, select: { status: true, assignment: { select: { status: true, member: { select: { userId: true } } } } } });
      if (!session) return null;
      if (session.assignment.status !== "active") throw new Error("ASSIGNMENT_CLOSED");
      if (session.status !== "scheduled") throw new Error("SESSION_ALREADY_FINISHED");
      const result = await tx.mentoringSession.update({ where: { id: sessionId }, data: { status, outcome } });
      await tx.auditLog.create({ data: audit(actor.userId, "MENTORSHIP_SESSION_UPDATED", "MentoringSession", sessionId, item.assignmentId) });
      await tx.notification.create({ data: { userId: session.assignment.member.userId, title: "Mentorship session updated", body: `Your mentorship session was marked ${status}.`, notificationType: "mentorship" } });
      return result;
    });
  }
  async updateObjective(objectiveId: string, actor: DeliveryActor, status: "not_started" | "in_progress" | "completed") {
    if (actor.role === "member") return null;
    return prisma.$transaction(async tx => {
      const item = await tx.mentoringObjective.findFirst({ where: { id: objectiveId, assignment: access(actor) }, select: { assignmentId: true } });
      if (!item) return null;
      await tx.$queryRaw`SELECT id FROM mentor_assignments WHERE id = ${item.assignmentId}::uuid FOR UPDATE`;
      const objective = await tx.mentoringObjective.findFirst({ where: { id: objectiveId, assignment: access(actor) }, select: { assignment: { select: { status: true } } } });
      if (!objective) return null;
      if (objective.assignment.status !== "active") throw new Error("ASSIGNMENT_CLOSED");
      const result = await tx.mentoringObjective.update({ where: { id: objectiveId }, data: { status } });
      await tx.auditLog.create({ data: audit(actor.userId, "MENTORSHIP_OBJECTIVE_STATUS_UPDATED", "MentoringObjective", objectiveId, item.assignmentId) });
      return result;
    });
  }
  async complete(assignmentId: string, actor: DeliveryActor) {
    if (actor.role !== "admin") return null;
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM mentor_assignments WHERE id = ${assignmentId}::uuid FOR UPDATE`;
      const assignment = await tx.mentorAssignment.findUnique({ where: { id: assignmentId }, select: { status: true, member: { select: { userId: true } }, mentor: { select: { userId: true } } } });
      if (!assignment) return null;
      if (assignment.status !== "active") throw new Error("ASSIGNMENT_CLOSED");
      const result = await tx.mentorAssignment.update({ where: { id: assignmentId }, data: { status: "completed", completedAt: new Date() } });
      await tx.auditLog.create({ data: audit(actor.userId, "MENTORSHIP_ASSIGNMENT_COMPLETED", "MentorAssignment", assignmentId, assignmentId) });
      await tx.notification.createMany({ data: [assignment.member.userId, assignment.mentor.userId].map(userId => ({ userId, title: "Mentorship completed", body: "An administrator marked your mentorship assignment as completed.", notificationType: "mentorship" })) });
      return result;
    });
  }
}
