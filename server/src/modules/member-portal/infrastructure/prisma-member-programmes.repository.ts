import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { MemberProgrammeRecord, MemberProgrammesRepository } from "../domain/member-programmes.repository.js";

export class PrismaMemberProgrammesRepository implements MemberProgrammesRepository {
  constructor(private readonly database = prisma) {}

  async listForMember(userId: string): Promise<MemberProgrammeRecord[] | null> {
    const member = await this.database.member.findUnique({ where: { userId }, select: { id: true } });
    if (!member) return null;

    const enrollments = await this.database.enrollment.findMany({
      where: { memberId: member.id, status: { in: ["enrolled", "completed"] } },
      orderBy: [{ enrolledAt: "desc" }, { id: "asc" }],
      select: {
        status: true,
        enrolledAt: true,
        cohort: { select: { name: true, startDate: true, endDate: true, programme: { select: { id: true, name: true, slug: true, description: true, startDate: true, endDate: true } } } },
      },
    });
    const assigned = new Map<string, MemberProgrammeRecord>();
    for (const enrollment of enrollments) {
      const programme = enrollment.cohort.programme;
      if (!assigned.has(programme.id)) assigned.set(programme.id, {
        id: programme.id,
        name: programme.name,
        slug: programme.slug,
        description: programme.description,
        startDate: (programme.startDate ?? enrollment.cohort.startDate)?.toISOString().slice(0, 10) ?? null,
        endDate: (programme.endDate ?? enrollment.cohort.endDate)?.toISOString().slice(0, 10) ?? null,
        cohortName: enrollment.cohort.name,
        enrollmentStatus: enrollment.status,
        enrolledAt: enrollment.enrolledAt.toISOString(),
      });
    }

    const published = await this.database.programme.findMany({
      where: { status: "published", id: { notIn: [...assigned.keys()] } },
      orderBy: [{ startDate: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, description: true, startDate: true, endDate: true },
    });
    const available = published.map((programme) => ({
      id: programme.id,
      name: programme.name,
      slug: programme.slug,
      description: programme.description,
      startDate: programme.startDate?.toISOString().slice(0, 10) ?? null,
      endDate: programme.endDate?.toISOString().slice(0, 10) ?? null,
      cohortName: null,
      enrollmentStatus: null,
      enrolledAt: null,
    }));
    return [...assigned.values(), ...available];
  }
}
