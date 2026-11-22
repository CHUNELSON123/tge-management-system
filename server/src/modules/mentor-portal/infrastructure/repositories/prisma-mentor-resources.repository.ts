import { prisma } from "../../../../infrastructure/database/prisma-client.js";
import type { MentorResourceInput, MentorResourcesRepository } from "../../domain/repositories/mentor-resources.repository.js";
export class PrismaMentorResourcesRepository implements MentorResourcesRepository {
  categories() { return prisma.resourceCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }); }
  async create(userId: string, input: MentorResourceInput) {
    return prisma.$transaction(async (tx) => {
      const mentor = await tx.mentor.findUnique({ where: { userId }, select: { id: true } });
      const category = await tx.resourceCategory.findUnique({ where: { id: input.categoryId }, select: { id: true } });
      const target = await (input.targetType === "programme"
          ? tx.programme.findFirst({ where: { id: input.targetId, assignments: { some: { userId, status: "active" } } }, select: { id: true } })
          : tx.cohort.findFirst({ where: { id: input.targetId, assignments: { some: { userId, status: "active" } } }, select: { id: true } }));
      if (!mentor || !category || !target) return null;
      const resource = await tx.resource.create({ data: { id: input.id, title: input.title, categoryId: category.id, uploadedByUserId: userId, resourceType: "Document", accessLevel: "restricted", status: "published", publishedAt: new Date(), ...(input.targetType === "programme" ? { programmes: { create: { programmeId: target.id } } } : { cohorts: { create: { cohortId: target.id } } }), versions: { create: { versionNumber: 1, storageKey: input.storageKey, originalFilename: input.filename, mimeType: input.mimeType, fileSize: input.fileSize, uploadedByUserId: userId } } }, select: { id: true } });
      await tx.auditLog.create({ data: { actorUserId: userId, action: "MENTOR_RESOURCE_UPLOADED", entityType: "Resource", entityId: resource.id, details: { targetType: input.targetType, targetId: input.targetId } } });
      return resource;
    });
  }
}
