import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { ProgrammeRegistrationRepository } from "../domain/programme-registration.repository.js";

const open = ["planned", "upcoming", "ongoing"];
const foundation = "TGE-FOUNDATION";
const feeSelect = { id: true, name: true, amountMinor: true, currency: true } as const;
const requestSelect = { id: true, status: true, reason: true, createdAt: true, reviewedAt: true, memberId: true, cohortId: true, chargeId: true, member: { select: { user: { select: { firstName: true, lastName: true, email: true } } } }, charge: { select: { amountMinor: true, currency: true, payments: { where: { kind: "manual", status: "confirmed", voidedAt: null }, select: { amountMinor: true } } } } } as const;
const statusMessage = (action: string) => action === "approved" ? "Your Foundation registration was approved." : "Your Foundation registration was not approved.";

export class PrismaProgrammeRegistrationRepository implements ProgrammeRegistrationRepository {
  async memberCohorts(userId: string) {
    const member = await prisma.member.findFirst({ where: { userId, membershipStatus: "active", user: { status: "ACTIVE", deletedAt: null } }, select: { id: true } });
    if (!member) throw new Error("MEMBER_NOT_ELIGIBLE");
    const cohorts = await prisma.cohort.findMany({ where: { programme: { code: foundation }, OR: [{ programme: { status: "published" }, status: { in: open } }, { registrationRequests: { some: { memberId: member.id } } }, { enrollments: { some: { memberId: member.id } } }] }, orderBy: { startDate: "asc" }, select: { id: true, name: true, startDate: true, endDate: true, capacity: true, status: true, programme: { select: { name: true, status: true, description: true, deliveryMode: true, durationWeeks: true } }, registrationFee: { select: { fee: { select: feeSelect } } }, _count: { select: { enrollments: { where: { status: "enrolled" } } } }, enrollments: { where: { memberId: member.id }, select: { status: true } }, registrationRequests: { where: { memberId: member.id }, select: requestSelect } } });
    return cohorts.map(({ _count, registrationFee, registrationRequests, enrollments, ...cohort }) => ({ ...cohort, open: cohort.programme.status === "published" && open.includes(cohort.status), enrolledCount: _count.enrollments, full: cohort.capacity !== null && _count.enrollments >= cohort.capacity, fee: registrationFee?.fee ?? null, enrollmentStatus: enrollments[0]?.status ?? null, request: registrationRequests[0] ?? null }));
  }
  async request(userId: string, cohortId: string) {
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM cohorts WHERE id = ${cohortId}::uuid FOR UPDATE`;
      const member = await tx.member.findFirst({ where: { userId, membershipStatus: "active", user: { status: "ACTIVE", deletedAt: null } }, select: { id: true } });
      if (!member) throw new Error("MEMBER_NOT_ELIGIBLE");
      const cohort = await tx.cohort.findUnique({ where: { id: cohortId }, select: { id: true, name: true, capacity: true, status: true, programme: { select: { code: true, status: true } }, _count: { select: { enrollments: { where: { status: "enrolled" } } } } } });
      if (!cohort || cohort.programme.code !== foundation || cohort.programme.status !== "published" || !open.includes(cohort.status)) throw new Error("COHORT_NOT_OPEN");
      if (await tx.enrollment.findUnique({ where: { memberId_cohortId: { memberId: member.id, cohortId } } })) throw new Error("ALREADY_ENROLLED");
      const prior = await tx.programmeRegistrationRequest.findUnique({ where: { memberId_cohortId: { memberId: member.id, cohortId } } });
      if (prior && ["pending", "waitlisted", "approved"].includes(prior.status)) throw new Error("REQUEST_EXISTS");
      const status = cohort.capacity !== null && cohort._count.enrollments >= cohort.capacity ? "waitlisted" : "pending";
      const record = await tx.programmeRegistrationRequest.upsert({ where: { memberId_cohortId: { memberId: member.id, cohortId } }, create: { memberId: member.id, cohortId, status }, update: { status, reason: null, reviewedById: null, reviewedAt: null, createdAt: new Date() }, select: requestSelect });
      const admins = await tx.user.findMany({ where: { status: "ACTIVE", deletedAt: null, role: { permissions: { some: { permission: { code: "programmes.manage" } } } } }, select: { id: true } });
      if (admins.length) await tx.notification.createMany({ data: admins.map(admin => ({ userId: admin.id, title: "Foundation registration request", body: `${record.member.user.firstName} ${record.member.user.lastName} requested ${cohort.name}.`, notificationType: "programme" })) });
      await tx.auditLog.create({ data: { actorUserId: userId, action: "FOUNDATION_REGISTRATION_REQUESTED", entityType: "ProgrammeRegistrationRequest", entityId: record.id, details: { cohortId, status } } });
      return record;
    });
  }
  async cancel(userId: string, requestId: string) {
    const changed = await prisma.programmeRegistrationRequest.updateMany({ where: { id: requestId, member: { userId }, status: { in: ["pending", "waitlisted"] } }, data: { status: "cancelled" } });
    if (!changed.count) throw new Error("REQUEST_NOT_PENDING");
    return { cancelled: true };
  }
  async adminCohorts() {
    return prisma.cohort.findMany({ where: { programme: { code: foundation } }, orderBy: { startDate: "desc" }, select: { id: true, name: true, status: true, startDate: true, capacity: true, programmeId: true, registrationFee: { select: { fee: { select: feeSelect } } }, _count: { select: { enrollments: { where: { status: "enrolled" } }, registrationRequests: { where: { status: { in: ["pending", "waitlisted"] } } } } } } });
  }
  async requests(cohortId: string) { return prisma.programmeRegistrationRequest.findMany({ where: { cohortId, cohort: { programme: { code: foundation } } }, orderBy: { createdAt: "asc" }, select: requestSelect }); }
  async setFee(cohortId: string, feeId: string | null, actorId: string) {
    return prisma.$transaction(async tx => {
      const cohort = await tx.cohort.findFirst({ where: { id: cohortId, programme: { code: foundation } }, select: { programmeId: true } });
      if (!cohort) throw new Error("COHORT_NOT_FOUND");
      if (feeId && !await tx.feeDefinition.findFirst({ where: { id: feeId, active: true, category: "programme", programmeId: cohort.programmeId, audience: { in: ["member", "all"] } } })) throw new Error("FEE_INVALID");
      const data = await tx.cohortRegistrationFee.upsert({ where: { cohortId }, create: { cohortId, feeId }, update: { feeId } });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "FOUNDATION_COHORT_FEE_UPDATED", entityType: "Cohort", entityId: cohortId, details: { feeId } } });
      return data;
    });
  }
  async review(requestId: string, decision: "approve" | "reject", reason: string | null, feeId: string | null | undefined, actorId: string) {
    return prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('tge_progression_policy')::bigint)`;
      const initial = await tx.programmeRegistrationRequest.findUnique({ where: { id: requestId }, select: { cohortId: true } });
      if (!initial) throw new Error("REQUEST_NOT_FOUND");
      await tx.$queryRaw`SELECT id FROM cohorts WHERE id = ${initial.cohortId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM programme_registration_requests WHERE id = ${requestId}::uuid FOR UPDATE`;
      const request = await tx.programmeRegistrationRequest.findUniqueOrThrow({ where: { id: requestId }, include: { member: { include: { user: true } }, cohort: { include: { programme: true, registrationFee: true, _count: { select: { enrollments: { where: { status: "enrolled" } } } } } } } });
      if (!["pending", "waitlisted"].includes(request.status)) throw new Error("REQUEST_NOT_PENDING");
      if (request.cohort.programme.code !== foundation) throw new Error("COHORT_NOT_FOUND");
      if (decision === "reject" && !reason?.trim()) throw new Error("REASON_REQUIRED");
      let chargeId: string | null = null;
      if (decision === "approve") {
        const cohort = request.cohort;
        if (cohort.programme.status !== "published" || !open.includes(cohort.status)) throw new Error("COHORT_NOT_OPEN");
        if (cohort.capacity !== null && cohort._count.enrollments >= cohort.capacity) throw new Error("COHORT_FULL");
        if (request.member.membershipStatus !== "active" || request.member.user.status !== "ACTIVE" || request.member.user.deletedAt) throw new Error("MEMBER_NOT_ELIGIBLE");
        const chosenFee = feeId === undefined ? cohort.registrationFee?.feeId ?? null : feeId;
        if (chosenFee) {
          const fee = await tx.feeDefinition.findFirst({ where: { id: chosenFee, active: true, category: "programme", programmeId: cohort.programmeId, audience: { in: ["member", "all"] } } });
          if (!fee) throw new Error("FEE_INVALID");
          if (fee.amountMinor > 0) { const charge = await tx.memberCharge.create({ data: { feeId: fee.id, memberId: request.memberId, periodKey: `cohort:${cohort.id}`, feeName: fee.name, amountMinor: fee.amountMinor, currency: fee.currency, createdByUserId: actorId } }); chargeId = charge.id; }
        }
        await tx.enrollment.create({ data: { memberId: request.memberId, cohortId: cohort.id, status: "enrolled" } });
      }
      const status = decision === "approve" ? "approved" : "rejected";
      const result = await tx.programmeRegistrationRequest.update({ where: { id: requestId }, data: { status, reason: decision === "reject" ? reason : null, reviewedById: actorId, reviewedAt: new Date(), chargeId }, select: requestSelect });
      await tx.notification.create({ data: { userId: request.member.userId, title: "Foundation registration", body: `${statusMessage(status)}${reason && decision === "reject" ? ` ${reason}` : ""}`, notificationType: "programme" } });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: `FOUNDATION_REGISTRATION_${status.toUpperCase()}`, entityType: "ProgrammeRegistrationRequest", entityId: requestId, details: { cohortId: request.cohortId, memberId: request.memberId, chargeId } } });
      return result;
    });
  }
}
