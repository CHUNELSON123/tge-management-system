import { prisma } from "../../../infrastructure/database/prisma-client.js";
import { assessProgress, requirements } from "../../programme-progression/progress-policy.js";
import type { AdminProgressRepository, ProgressInput, ProgressPolicyInput } from "../domain/admin-progress.repository.js";

export class PrismaAdminProgressRepository implements AdminProgressRepository {
  async getPolicy(scope: "programme" | "cohort", id: string) {
    if (scope === "programme") {
      const programme = await prisma.programme.findUnique({ where: { id }, select: { progressPolicy: true } });
      return programme ? { policy: programme.progressPolicy, source: programme.progressPolicy ? "programme" : null, override: false } : null;
    }
    const cohort = await prisma.cohort.findUnique({ where: { id }, select: { progressPolicy: true, programme: { select: { progressPolicy: true } } } });
    if (!cohort) return null;
    return { policy: cohort.progressPolicy ?? cohort.programme.progressPolicy, source: cohort.progressPolicy ? "cohort" : cohort.programme.progressPolicy ? "programme" : null, override: !!cohort.progressPolicy };
  }

  async savePolicy(scope: "programme" | "cohort", id: string, input: ProgressPolicyInput, actorId: string) {
    const saved = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('tge_progression_policy')::bigint)`;
      const owner = scope === "programme" ? await tx.programme.findUnique({ where: { id }, select: { status: true, progressPolicy: true } }) : await tx.cohort.findUnique({ where: { id }, select: { status: true, progressPolicy: true, programme: { select: { status: true } } } });
      if (!owner) return false;
      if (owner.status === "archived") throw new Error("PROGRESS_OWNER_ARCHIVED");
      if ("programme" in owner && owner.programme.status === "archived") throw new Error("PROGRESS_OWNER_ARCHIVED");
      const existing = owner.progressPolicy;
      if (existing) {
        const oldItems = requirements(existing);
        if (input.deliverables.some((item) => oldItems.some((old) => old.id === item.id && old.title !== item.title))) throw new Error("DELIVERABLE_ID_REUSED");
        if (existing.attendanceMinimum === input.attendanceMinimum && JSON.stringify(oldItems) === JSON.stringify(input.deliverables)) return true;
      }
      const deliverables = input.deliverables.map((item) => ({ id: item.id, title: item.title }));
      const values = { attendanceMinimum: input.attendanceMinimum, deliverables };
      if (scope === "programme") await tx.programmeProgressPolicy.upsert({ where: { programmeId: id }, create: { programmeId: id, ...values }, update: { ...values, version: { increment: 1 } } });
      else { await tx.cohortProgressPolicy.upsert({ where: { cohortId: id }, create: { cohortId: id, ...values }, update: { ...values, version: { increment: 1 } } }); await tx.cohort.update({ where: { id }, data: { progressRevision: { increment: 1 } } }); }
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_PROGRESS_REQUIREMENTS_CHANGED", entityType: scope === "programme" ? "Programme" : "Cohort", entityId: id, details: { attendanceMinimum: input.attendanceMinimum, deliverables, previousVersion: existing?.version ?? null } } });
      return true;
    });
    return saved ? this.getPolicy(scope, id) : null;
  }

  async removeOverride(id: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('tge_progression_policy')::bigint)`;
      const cohort = await tx.cohort.findUnique({ where: { id }, select: { status: true, progressPolicy: true, programme: { select: { status: true } } } });
      if (!cohort) return false;
      if (cohort.status === "archived" || cohort.programme.status === "archived") throw new Error("PROGRESS_OWNER_ARCHIVED");
      if (cohort.progressPolicy) {
        await tx.cohortProgressPolicy.delete({ where: { cohortId: id } });
        await tx.cohort.update({ where: { id }, data: { progressRevision: { increment: 1 } } });
        await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_COHORT_REQUIREMENTS_RESET", entityType: "Cohort", entityId: id, details: { previousVersion: cohort.progressPolicy.version } } });
      }
      return true;
    });
  }

  async getEnrollment(id: string) {
    const row = await prisma.enrollment.findUnique({ where: { id }, select: { id: true, status: true, completedAt: true, progress: true, member: { select: { user: { select: { firstName: true, lastName: true } } } }, cohort: { select: { name: true, progressRevision: true, progressPolicy: true, programme: { select: { name: true, progressPolicy: true } } } } } });
    if (!row) return null;
    const policy = row.cohort.progressPolicy ?? row.cohort.programme.progressPolicy;
    const assessment = assessProgress(policy, row.cohort.progressPolicy ? "cohort" : policy ? "programme" : null, row.progress, row.cohort.progressRevision);
    return { id: row.id, memberName: `${row.member.user.firstName} ${row.member.user.lastName}`.trim(), programmeName: row.cohort.programme.name, cohortName: row.cohort.name, enrollmentStatus: row.status, completedAt: row.completedAt?.toISOString() ?? null, ...assessment };
  }

  async saveEnrollment(id: string, input: ProgressInput, actorId: string) {
    const saved = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('tge_progression_policy')::bigint)`;
      const row = await tx.enrollment.findUnique({ where: { id }, select: { id: true, status: true, cohort: { select: { progressPolicy: true, programme: { select: { progressPolicy: true } } } } } });
      if (!row) return false;
      if (row.status === "withdrawn") throw new Error("PROGRESS_WITHDRAWN");
      const policy = row.cohort.progressPolicy ?? row.cohort.programme.progressPolicy;
      if (!policy) throw new Error("REQUIREMENTS_NOT_CONFIGURED");
      const validIds = new Set(requirements(policy).map((item) => item.id));
      if (input.completedDeliverables.some((item) => !validIds.has(item))) throw new Error("PROGRESS_REQUIREMENTS_CHANGED");
      await tx.enrollmentProgress.upsert({ where: { enrollmentId: id }, create: { enrollmentId: id, ...input }, update: input });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_ENROLLMENT_PROGRESS_UPDATED", entityType: "Enrollment", entityId: id, details: { ...input } } });
      return true;
    });
    return saved ? this.getEnrollment(id) : null;
  }

  async revokeCompletion(id: string, actorId: string) {
    const saved = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('tge_progression_policy')::bigint)`;
      const row = await tx.enrollment.findUnique({ where: { id }, select: { status: true, cohort: { select: { progressPolicy: true, programme: { select: { progressPolicy: true } } } } } });
      if (!row) return false;
      if (row.status !== "completed") throw new Error("COMPLETION_NOT_RECORDED");
      if (!row.cohort.progressPolicy && !row.cohort.programme.progressPolicy) throw new Error("REQUIREMENTS_NOT_CONFIGURED");
      await tx.enrollmentProgress.upsert({ where: { enrollmentId: id }, create: { enrollmentId: id, approvedPolicyKey: null }, update: { approvedPolicyKey: null } });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_ENROLLMENT_COMPLETION_REVOKED", entityType: "Enrollment", entityId: id } });
      return true;
    });
    return saved ? this.getEnrollment(id) : null;
  }
}
