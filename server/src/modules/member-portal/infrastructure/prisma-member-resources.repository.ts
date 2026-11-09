import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { MemberResource, MemberResourcesRepository } from "../domain/member-resources.repository.js";

export class PrismaMemberResourcesRepository implements MemberResourcesRepository {
  constructor(private readonly database = prisma) {}

  async findForUser(userId: string, now: Date): Promise<MemberResource[] | null> {
    const member = await this.database.member.findUnique({ where: { userId }, select: {
      enrollments: { where: { status: "enrolled" }, select: { cohortId: true, cohort: { select: { programmeId: true } } } },
    } });
    if (!member) return null;
    const cohortIds = [...new Set(member.enrollments.map((enrollment) => enrollment.cohortId))];
    const programmeIds = [...new Set(member.enrollments.map((enrollment) => enrollment.cohort.programmeId))];
    const records = await this.database.resource.findMany({
      where: {
        status: "published", publishedAt: { not: null, lte: now },
        OR: [
          { accessLevel: { in: ["public", "member"] } },
          ...(programmeIds.length ? [{ programmes: { some: { programmeId: { in: programmeIds } } } }] : []),
          ...(cohortIds.length ? [{ cohorts: { some: { cohortId: { in: cohortIds } } } }] : []),
        ],
      },
      orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
      select: { id: true, title: true, description: true, resourceType: true, publishedAt: true, category: { select: { name: true } }, versions: { orderBy: { versionNumber: "desc" }, take: 1, select: { versionNumber: true, mimeType: true, fileSize: true } } },
    });
    return records.map((record) => ({
      id: record.id, title: record.title, description: record.description, category: record.category.name,
      resourceType: record.resourceType, version: record.versions[0]?.versionNumber ?? null, mimeType: record.versions[0]?.mimeType ?? null,
      fileSize: record.versions[0] ? Number(record.versions[0].fileSize) : null,
      publishedAt: record.publishedAt?.toISOString() ?? null,
    }));
  }

  async findFileForUser(userId: string, resourceId: string, now: Date) {
    const member = await this.database.member.findUnique({ where: { userId }, select: {
      enrollments: { where: { status: "enrolled" }, select: { cohortId: true, cohort: { select: { programmeId: true } } } },
    } });
    if (!member) return null;
    const cohortIds = [...new Set(member.enrollments.map((enrollment) => enrollment.cohortId))];
    const programmeIds = [...new Set(member.enrollments.map((enrollment) => enrollment.cohort.programmeId))];
    const record = await this.database.resource.findFirst({
      where: {
        id: resourceId, status: "published", publishedAt: { not: null, lte: now },
        OR: [
          { accessLevel: { in: ["public", "member"] } },
          ...(programmeIds.length ? [{ programmes: { some: { programmeId: { in: programmeIds } } } }] : []),
          ...(cohortIds.length ? [{ cohorts: { some: { cohortId: { in: cohortIds } } } }] : []),
        ],
      },
      select: { versions: { orderBy: { versionNumber: "desc" }, take: 1, select: { storageKey: true, originalFilename: true, mimeType: true } } },
    });
    const version = record?.versions[0];
    return version ? { storageKey: version.storageKey, originalFilename: version.originalFilename, mimeType: version.mimeType } : null;
  }
}
