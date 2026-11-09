import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { MemberProfileRecord, MemberProfileRepository, MemberProfileUpdate } from "../domain/member-profile.repository.js";

const profileFields = {
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  location: true,
  dateOfBirth: true,
  gender: true,
  nationality: true,
  preferredLanguage: true,
  timezone: true,
  bio: true,
  memberProfile: {
    select: {
      membershipNo: true,
      joinedAt: true,
      membershipStatus: true,
      businesses: {
        where: { status: "active" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, description: true, websiteUrl: true, email: true, phone: true, address: true },
      },
    },
  },
} as const;

function toMemberProfile(user: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  location: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  nationality: string | null;
  preferredLanguage: string | null;
  timezone: string | null;
  bio: string | null;
  memberProfile: {
    membershipNo: string | null;
    joinedAt: Date | null;
    membershipStatus: string;
    businesses: Array<{ id: string; name: string; description: string | null; websiteUrl: string | null; email: string | null; phone: string | null; address: string | null }>;
  } | null;
}) {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    location: user.location,
    dateOfBirth: user.dateOfBirth?.toISOString().slice(0, 10) ?? null,
    gender: user.gender,
    nationality: user.nationality,
    preferredLanguage: user.preferredLanguage,
    timezone: user.timezone,
    bio: user.bio,
    businesses: user.memberProfile?.businesses ?? [],
    membership: user.memberProfile ? {
      membershipNumber: user.memberProfile.membershipNo,
      joinedAt: user.memberProfile.joinedAt?.toISOString() ?? null,
      status: user.memberProfile.membershipStatus,
    } : null,
  };
}

export class PrismaMemberProfileRepository implements MemberProfileRepository {
  constructor(private readonly database = prisma) {}

  async findByUserId(userId: string) {
    const user = await this.database.user.findUnique({
      where: { id: userId },
      select: profileFields,
    });

    if (!user) return null;
    return toMemberProfile(user);
  }

  async updateByUserId(userId: string, input: MemberProfileUpdate) {
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

    return this.database.$transaction(async (transaction) => {
      const current = await transaction.user.findUnique({ where: { id: userId }, select: { memberProfile: { select: { id: true } } } });
      if (!current?.memberProfile) return null;
      const updated = await transaction.user.update({ where: { id: userId }, data, select: profileFields });
      await transaction.auditLog.create({
        data: { actorUserId: userId, action: "MEMBER_PROFILE_UPDATED", entityType: "User", entityId: userId },
      });
      return toMemberProfile(updated);
    });
  }
}
