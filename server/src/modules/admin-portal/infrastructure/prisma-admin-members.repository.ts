import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type {
  AdminMemberDetail,
  AdminMemberOnboardingRecord,
  AdminMemberEnrollment,
  AdminMemberListRecord,
  AdminMembershipApplicationPage,
  AdminMembersFilter,
  AdminMembersPage,
  AdminMembersRepository,
  AdminMemberUpdate,
  AdminDirectMemberInput,
} from "../domain/admin-members.repository.js";

function makeWhere(filter: AdminMembersFilter) {
  const search = filter.search?.trim();
  return {
    user: {
      is: {
        deletedAt: null,
        ...(filter.status === "pending_activation" ? { status: "PENDING_ACTIVATION" as const } : filter.status === "suspended" ? { status: "SUSPENDED" as const } : filter.status === "deactivated" ? { status: "DEACTIVATED" as const } : filter.status === "active" ? { status: "ACTIVE" as const } : {}),
      },
    },
    ...(filter.status && !["pending_activation", "suspended", "deactivated"].includes(filter.status) ? { membershipStatus: filter.status } : {}),
    ...(filter.programmeId || filter.cohortId ? {
      enrollments: { some: { cohort: {
        ...(filter.programmeId ? { programmeId: filter.programmeId } : {}),
        ...(filter.cohortId ? { id: filter.cohortId } : {}),
      } } },
    } : {}),
    ...(search ? { OR: [
      { user: { is: { firstName: { contains: search, mode: "insensitive" as const } } } },
      { user: { is: { lastName: { contains: search, mode: "insensitive" as const } } } },
      { user: { is: { email: { contains: search, mode: "insensitive" as const } } } },
      { user: { is: { phone: { contains: search, mode: "insensitive" as const } } } },
      { businesses: { some: { name: { contains: search, mode: "insensitive" as const } } } },
    ] } : {}),
  };
}

function memberListRecord(member: {
  id: string; membershipNo: string | null; membershipStatus: string; joinedAt: Date | null;
  user: { firstName: string; lastName: string; email: string; phone: string | null; status: string };
  enrollments: Array<{ cohort: { id: string; name: string; programme: { id: string; name: string } } }>;
  businesses: Array<{ name: string }>;
}): AdminMemberListRecord {
  return {
    id: member.id,
    membershipNumber: member.membershipNo,
    displayName: [member.user.firstName, member.user.lastName].filter(Boolean).join(" "),
    email: member.user.email,
    phone: member.user.phone,
    status: member.user.status === "PENDING_ACTIVATION" ? "pending_activation" : member.user.status === "SUSPENDED" ? "suspended" : member.user.status === "DEACTIVATED" ? "deactivated" : member.membershipStatus,
    joinedAt: member.joinedAt?.toISOString() ?? null,
    programmes: member.enrollments.map(({ cohort }) => ({ programmeId: cohort.programme.id, programmeName: cohort.programme.name, cohortId: cohort.id, cohortName: cohort.name })),
    businesses: member.businesses.map(({ name }) => name),
  };
}

export class PrismaAdminMembersRepository implements AdminMembersRepository {
  async list(filter: AdminMembersFilter): Promise<AdminMembersPage> {
    const where = makeWhere(filter);
    const [total, rows, totalMembers, activeMembers, pendingApproval, inactiveMembers, alumni, statuses, programmes] = await Promise.all([
      prisma.member.count({ where }),
      prisma.member.findMany({
        where,
        orderBy: [{ joinedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
        select: {
          id: true, membershipNo: true, membershipStatus: true, joinedAt: true,
          user: { select: { firstName: true, lastName: true, email: true, phone: true, status: true } },
          enrollments: { orderBy: [{ enrolledAt: "desc" }, { id: "asc" }], take: 3, select: { cohort: { select: { id: true, name: true, programme: { select: { id: true, name: true } } } } } },
          businesses: { orderBy: { name: "asc" }, select: { name: true } },
        },
      }),
      prisma.member.count({ where: { user: { is: { deletedAt: null } } } }),
      prisma.member.count({ where: { user: { is: { deletedAt: null, status: "ACTIVE" } }, membershipStatus: "active" } }),
      prisma.membershipApplication.count({ where: { status: "PENDING" } }),
      prisma.member.count({ where: { user: { is: { deletedAt: null } }, membershipStatus: "inactive" } }),
      prisma.member.count({ where: { user: { is: { deletedAt: null } }, membershipStatus: "alumni" } }),
      prisma.member.findMany({ where: { user: { is: { deletedAt: null } } }, distinct: ["membershipStatus"], orderBy: { membershipStatus: "asc" }, select: { membershipStatus: true } }),
      prisma.programme.findMany({ orderBy: [{ name: "asc" }, { id: "asc" }], select: { id: true, name: true, cohorts: { orderBy: [{ startDate: "desc" }, { name: "asc" }], select: { id: true, name: true } } } }),
    ]);
    return {
      summary: { totalMembers, activeMembers, pendingApproval, inactiveMembers, alumni },
      rows: rows.map(memberListRecord),
      total,
      page: filter.page,
      pageSize: filter.pageSize,
      membershipStatuses: [...new Set(["active", "pending_activation", "suspended", "deactivated", "inactive", "alumni", ...statuses.map(({ membershipStatus }) => membershipStatus)])],
      programmes,
    };
  }

  async getDetail(memberId: string): Promise<AdminMemberDetail | null> {
    const member = await prisma.member.findFirst({
      where: { id: memberId, user: { is: { deletedAt: null } } },
      select: {
        id: true, membershipNo: true, membershipStatus: true, joinedAt: true,
        user: { select: {
          status: true, emailVerifiedAt: true, firstName: true, lastName: true, email: true, phone: true,
          location: true, dateOfBirth: true, gender: true, nationality: true, preferredLanguage: true, timezone: true, bio: true,
        } },
        businesses: { orderBy: { name: "asc" }, select: { id: true, name: true, status: true, publicationStatus: true } },
      },
    });
    if (!member) return null;
    return {
      id: member.id,
      membershipNumber: member.membershipNo,
      membershipStatus: member.membershipStatus,
      joinedAt: member.joinedAt?.toISOString() ?? null,
      accountStatus: member.user.status,
      emailVerifiedAt: member.user.emailVerifiedAt?.toISOString() ?? null,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      email: member.user.email,
      phone: member.user.phone,
      location: member.user.location,
      dateOfBirth: member.user.dateOfBirth?.toISOString().slice(0, 10) ?? null,
      gender: member.user.gender,
      nationality: member.user.nationality,
      preferredLanguage: member.user.preferredLanguage,
      timezone: member.user.timezone,
      bio: member.user.bio,
      businesses: member.businesses,
    };
  }

  async getProgrammes(memberId: string): Promise<AdminMemberEnrollment[] | null> {
    const member = await prisma.member.findFirst({ where: { id: memberId, user: { is: { deletedAt: null } } }, select: { id: true } });
    if (!member) return null;
    const enrollments = await prisma.enrollment.findMany({
      where: { memberId },
      orderBy: [{ enrolledAt: "desc" }, { id: "asc" }],
      select: {
        id: true, status: true, enrolledAt: true, completedAt: true,
        cohort: { select: { id: true, name: true, startDate: true, endDate: true, programme: { select: { id: true, name: true } } } },
      },
    });
    return enrollments.map(({ id, status, enrolledAt, completedAt, cohort }) => ({
      id,
      programmeId: cohort.programme.id,
      programmeName: cohort.programme.name,
      cohortId: cohort.id,
      cohortName: cohort.name,
      cohortStartDate: cohort.startDate.toISOString().slice(0, 10),
      cohortEndDate: cohort.endDate?.toISOString().slice(0, 10) ?? null,
      enrollmentStatus: status,
      enrolledAt: enrolledAt.toISOString(),
      completedAt: completedAt?.toISOString() ?? null,
    }));
  }

  async updateProfile(memberId: string, actorUserId: string, input: AdminMemberUpdate): Promise<AdminMemberDetail | null> {
    const exists = await prisma.member.findFirst({ where: { id: memberId, user: { is: { deletedAt: null } } }, select: { userId: true } });
    if (!exists) return null;
    const data = {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.dateOfBirth !== undefined ? { dateOfBirth: input.dateOfBirth ? new Date(`${input.dateOfBirth}T00:00:00.000Z`) : null } : {}),
      ...(input.gender !== undefined ? { gender: input.gender } : {}),
      ...(input.nationality !== undefined ? { nationality: input.nationality } : {}),
      ...(input.preferredLanguage !== undefined ? { preferredLanguage: input.preferredLanguage } : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
    };
    await prisma.$transaction(async (transaction) => {
      await transaction.user.update({ where: { id: exists.userId }, data });
      await transaction.auditLog.create({ data: {
        actorUserId,
        action: "ADMIN_MEMBER_PROFILE_UPDATED",
        entityType: "Member",
        entityId: memberId,
        details: { changedFields: Object.keys(data) },
      } });
    });
    return this.getDetail(memberId);
  }

  async listPendingApplications(page: number, pageSize: number, search = ""): Promise<AdminMembershipApplicationPage> {
    const q = search.trim();
    const where = {
      status: "PENDING" as const,
      ...(q ? { OR: [
        { applicantFirstName: { contains: q, mode: "insensitive" as const } },
        { applicantLastName: { contains: q, mode: "insensitive" as const } },
        { applicantEmail: { contains: q, mode: "insensitive" as const } },
        { applicantPhone: { contains: q, mode: "insensitive" as const } },
      ] } : {}),
    };
    const [total, rows] = await Promise.all([
      prisma.membershipApplication.count({ where }),
      prisma.membershipApplication.findMany({
        where,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, applicantFirstName: true, applicantLastName: true, applicantEmail: true, applicantPhone: true, status: true, createdAt: true },
      }),
    ]);
    return {
      rows: rows.map((row) => ({ id: row.id, firstName: row.applicantFirstName, lastName: row.applicantLastName, email: row.applicantEmail, phone: row.applicantPhone, status: row.status, createdAt: row.createdAt.toISOString() })),
      total, page, pageSize,
    };
  }

  async directRegister(input: AdminDirectMemberInput, actorUserId: string, passwordHash: string): Promise<AdminMemberOnboardingRecord> {
    const created = await prisma.$transaction(async (transaction) => {
      const existing = await transaction.user.findFirst({ where: { email: { equals: input.email, mode: "insensitive" }, deletedAt: null }, select: { id: true } });
      if (existing) throw new Error("DUPLICATE_ACCOUNT");
      const role = await transaction.role.findUnique({ where: { name: "Member" }, select: { id: true } });
      if (!role) throw new Error("MEMBER_ROLE_NOT_CONFIGURED");
      const user = await transaction.user.create({ data: {
        roleId: role.id, email: input.email, passwordHash, firstName: input.firstName, lastName: input.lastName,
        phone: input.phone ?? null, location: input.location ?? null,
        dateOfBirth: input.dateOfBirth ? new Date(`${input.dateOfBirth}T00:00:00.000Z`) : null,
        gender: input.gender ?? null, nationality: input.nationality ?? null,
        preferredLanguage: input.preferredLanguage ?? null, timezone: input.timezone ?? null, bio: input.bio ?? null,
        status: "PENDING_ACTIVATION",
      }, select: { id: true, firstName: true, lastName: true, email: true } });
      await transaction.member.create({ data: { userId: user.id, membershipStatus: "active", joinedAt: new Date() } });
      await transaction.auditLog.create({ data: {
        actorUserId, action: "ADMIN_MEMBER_DIRECTLY_REGISTERED", entityType: "Member", entityId: user.id,
        details: { accountStatus: "PENDING_ACTIVATION", membershipStatus: "active" },
      } });
      return user;
    });
    return { userId: created.id, firstName: created.firstName, lastName: created.lastName, email: created.email };
  }

  async approveApplication(applicationId: string, actorUserId: string, passwordHash: string): Promise<AdminMemberOnboardingRecord> {
    return prisma.$transaction(async (transaction) => {
      const application = await transaction.membershipApplication.findUnique({ where: { id: applicationId } });
      if (!application) throw new Error("APPLICATION_NOT_FOUND");
      if (application.status !== "PENDING") throw new Error("APPLICATION_NOT_PENDING");
      const existing = await transaction.user.findFirst({ where: { email: { equals: application.applicantEmail, mode: "insensitive" }, deletedAt: null }, select: { id: true } });
      if (existing) throw new Error("DUPLICATE_ACCOUNT");
      const role = await transaction.role.findUnique({ where: { name: "Member" }, select: { id: true } });
      if (!role) throw new Error("MEMBER_ROLE_NOT_CONFIGURED");
      const user = await transaction.user.create({ data: {
        roleId: role.id, email: application.applicantEmail.trim().toLowerCase(), passwordHash,
        firstName: application.applicantFirstName, lastName: application.applicantLastName,
        phone: application.applicantPhone, location: application.applicantLocation, dateOfBirth: application.applicantDateOfBirth, gender: application.applicantGender, nationality: application.applicantNationality, preferredLanguage: application.applicantPreferredLanguage, timezone: application.applicantTimezone, bio: application.applicantBio, status: "PENDING_ACTIVATION",
      }, select: { id: true, firstName: true, lastName: true, email: true } });
      await transaction.member.create({ data: { userId: user.id, membershipStatus: "active", joinedAt: new Date() } });
      const reviewedAt = new Date();
      const decision = await transaction.membershipApplication.updateMany({
        where: { id: application.id, status: "PENDING" },
        data: { status: "APPROVED", reviewedByUserId: actorUserId, reviewedAt, userId: user.id },
      });
      if (decision.count !== 1) throw new Error("APPLICATION_NOT_PENDING");
      await transaction.auditLog.create({ data: {
        actorUserId, action: "MEMBERSHIP_APPLICATION_APPROVED", entityType: "MembershipApplication", entityId: application.id,
        details: { memberUserId: user.id, membershipStatus: "active", accountStatus: "PENDING_ACTIVATION" },
      } });
      return { userId: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email };
    });
  }

  async rejectApplication(applicationId: string, actorUserId: string, reason: string) {
    return prisma.$transaction(async (transaction) => {
      const application = await transaction.membershipApplication.findUnique({ where: { id: applicationId } });
      if (!application) return null;
      if (application.status !== "PENDING") throw new Error("APPLICATION_NOT_PENDING");
      const reviewedAt = new Date();
      const decision = await transaction.membershipApplication.updateMany({
        where: { id: application.id, status: "PENDING" },
        data: { status: "REJECTED", rejectionReason: reason, reviewedByUserId: actorUserId, reviewedAt },
      });
      if (decision.count !== 1) throw new Error("APPLICATION_NOT_PENDING");
      await transaction.auditLog.create({ data: {
        actorUserId, action: "MEMBERSHIP_APPLICATION_REJECTED", entityType: "MembershipApplication", entityId: application.id,
        details: { reason },
      } });
      return { id: application.id, firstName: application.applicantFirstName, lastName: application.applicantLastName, email: application.applicantEmail, phone: application.applicantPhone, status: "REJECTED" as const, createdAt: application.createdAt.toISOString() };
    });
  }

  async getProfilePhoto(memberId: string) {
    const member = await prisma.member.findFirst({ where: { id: memberId, user: { is: { deletedAt: null } } }, select: { userId: true } });
    if (!member) return null;
    return prisma.memberProfilePhoto.findUnique({ where: { userId: member.userId }, select: { contentType: true, data: true } });
  }

  async saveProfilePhoto(memberId: string, actorUserId: string, contentType: string, data: Uint8Array): Promise<boolean> {
    const member = await prisma.member.findFirst({ where: { id: memberId, user: { is: { deletedAt: null } } }, select: { userId: true } });
    if (!member) return false;
    await prisma.$transaction(async (transaction) => {
      await transaction.memberProfilePhoto.upsert({
        where: { userId: member.userId },
        create: { userId: member.userId, contentType, data: new Uint8Array(data) },
        update: { contentType, data: new Uint8Array(data) },
      });
      await transaction.auditLog.create({ data: { actorUserId, action: "ADMIN_MEMBER_PROFILE_PHOTO_UPDATED", entityType: "Member", entityId: memberId, details: { contentType, sizeBytes: data.byteLength } } });
    });
    return true;
  }
}
