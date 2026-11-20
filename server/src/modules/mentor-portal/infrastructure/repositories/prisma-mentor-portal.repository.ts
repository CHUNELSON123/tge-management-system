import { prisma } from "../../../../infrastructure/database/prisma-client.js";
import type { MentorPortalRepository, MentorProfileUpdate } from "../../domain/repositories/mentor-portal.repository.js";

export class PrismaMentorPortalRepository implements MentorPortalRepository {
  sessions(userId: string) { return prisma.mentoringSession.findMany({ where: { assignment: { mentor: { userId } } }, orderBy: { scheduledStart: "desc" }, select: { id: true, title: true, scheduledStart: true, scheduledEnd: true, locationOrUrl: true, status: true, assignment: { select: { id: true, member: { select: { id: true, user: { select: { firstName: true, lastName: true } } } }, programme: { select: { id: true, name: true } } } } } }); }
  async getProfile(userId: string) {
    return prisma.mentor.findUnique({ where: { userId }, select: { expertise: true, professionalBackground: true, availability: true, status: true, createdAt: true,
      user: { select: { firstName: true, lastName: true, email: true, phone: true, location: true, bio: true, lastLoginAt: true } } } });
  }

  async updateProfile(userId: string, input: MentorProfileUpdate) {
    const profile = await prisma.mentor.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) return null;
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { firstName: input.firstName, lastName: input.lastName, phone: input.phone, location: input.location, bio: input.bio } });
      await tx.mentor.update({ where: { userId }, data: { expertise: input.expertise, professionalBackground: input.professionalBackground, availability: input.availability } });
      await tx.auditLog.create({ data: { actorUserId: userId, action: "MENTOR_PROFILE_UPDATED", entityType: "Mentor", entityId: profile.id } });
    });
    return this.getProfile(userId);
  }

  async getAssignedWork(userId: string) {
    const mentor = await prisma.mentor.findUnique({ where: { userId }, select: { id: true } });
    if (!mentor) return null;
    const [programmeAssignments, cohortAssignments, assignments, sessions] = await Promise.all([
      prisma.programmeAssignment.findMany({ where: { userId, status: "active" }, select: { programme: { select: { id: true, name: true, description: true, status: true, coverImageUrl: true } } } }),
      prisma.cohortAssignment.findMany({ where: { userId, status: "active" }, select: { assignedAt: true, cohort: { select: { id: true, name: true, status: true, startDate: true, endDate: true, programme: { select: { id: true, name: true, description: true, status: true, coverImageUrl: true } }, enrollments: { select: { status: true, enrolledAt: true, member: { select: { id: true, membershipStatus: true, user: { select: { firstName: true, lastName: true, email: true, lastLoginAt: true } } } } } } } } } }),
      prisma.mentorAssignment.findMany({ where: { mentorId: mentor.id }, select: { id: true, status: true, createdAt: true, programme: { select: { id: true, name: true } }, member: { select: { id: true, membershipStatus: true, user: { select: { firstName: true, lastName: true, email: true, lastLoginAt: true } } } } } }),
      prisma.mentoringSession.findMany({ where: { assignment: { mentorId: mentor.id, status: "active" }, scheduledStart: { gte: new Date() }, status: "scheduled" }, orderBy: { scheduledStart: "asc" }, select: { id: true, title: true, scheduledStart: true, scheduledEnd: true, locationOrUrl: true, assignment: { select: { member: { select: { user: { select: { firstName: true, lastName: true } } } } } } } }),
    ]);
    const programmes = new Map(programmeAssignments.map(({ programme }) => [programme.id, programme]));
    for (const { cohort } of cohortAssignments) programmes.set(cohort.programme.id, cohort.programme);
    const resources = await prisma.resource.findMany({ where: { status: "published", publishedAt: { not: null, lte: new Date() }, OR: [ { programmes: { some: { programmeId: { in: [...programmes.keys()] } } } }, { cohorts: { some: { cohortId: { in: cohortAssignments.map(({ cohort }) => cohort.id) } } } } ] }, orderBy: { publishedAt: "desc" }, select: { id: true, title: true, resourceType: true, uploadedByUserId: true, publishedAt: true, category: { select: { id: true, name: true } }, programmes: { select: { programmeId: true } }, cohorts: { select: { cohortId: true } }, versions: { orderBy: { versionNumber: "desc" }, take: 1, select: { mimeType: true, fileSize: true } } } });
    return { programmes: [...programmes.values()], directProgrammeIds: programmeAssignments.map(({ programme }) => programme.id), cohorts: cohortAssignments.map(({ cohort, assignedAt }) => ({ ...cohort, assignedAt })), assignments, sessions, resources: resources.map((r) => ({ id: r.id, title: r.title, resourceType: r.resourceType, mimeType: r.versions[0]?.mimeType ?? null, fileSize: r.versions[0] ? Number(r.versions[0].fileSize) : null, category: r.category, uploadedByUserId: r.uploadedByUserId, publishedAt: r.publishedAt, programmeIds: r.programmes.map((p) => p.programmeId), cohortIds: r.cohorts.map((c) => c.cohortId) })) };
  }

  async findResourceFile(userId: string, resourceId: string) {
    const resource = await prisma.resource.findFirst({ where: { id: resourceId, status: "published", publishedAt: { not: null, lte: new Date() }, OR: [ { programmes: { some: { programme: { OR: [{ assignments: { some: { userId, status: "active" } } }, { cohorts: { some: { assignments: { some: { userId, status: "active" } } } } }] } } } }, { cohorts: { some: { cohort: { assignments: { some: { userId, status: "active" } } } } } } ] }, select: { versions: { orderBy: { versionNumber: "desc" }, take: 1, select: { storageKey: true, originalFilename: true, mimeType: true } } } });
    return resource?.versions[0] ?? null;
  }
}
