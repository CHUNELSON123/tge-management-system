import { prisma } from "../../../infrastructure/database/prisma-client.js";
import { randomUUID } from "node:crypto";
import type { AdminBusinessFilter, AdminBusinessRepository, AdminBusinessReviewInput, AdminBusinessUpdateInput, AdminBusinessWriteInput } from "../domain/admin-businesses.repository.js";
import { canReviewBusinessTransition } from "../domain/business-review-lifecycle.js";

const summary = { id: true, memberId: true, name: true, slug: true, status: true, publicationStatus: true, address: true, createdAt: true,
  member: { select: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
  categories: { orderBy: { category: { name: "asc" as const } }, select: { category: { select: { id: true, name: true } } } },
} as const;
function mapBusiness(row: any) {
  return { id: row.id, memberId: row.memberId, name: row.name, slug: row.slug, status: row.status, publicationStatus: row.publicationStatus,
    address: row.address, createdAt: row.createdAt.toISOString(), owner: { id: row.member.user.id, name: [row.member.user.firstName, row.member.user.lastName].filter(Boolean).join(" "), email: row.member.user.email },
    categories: row.categories.map(({ category }: any) => category) };
}

export class PrismaAdminBusinessesRepository implements AdminBusinessRepository {
  async list(filter: AdminBusinessFilter) {
    const search = filter.search?.trim();
    const clauses: object[] = [];
    if (filter.status) clauses.push({ publicationStatus: filter.status });
    if (filter.categoryId) clauses.push({ categories: { some: { categoryId: filter.categoryId } } });
    if (search) clauses.push({ OR: [
      { name: { contains: search, mode: "insensitive" as const } },
      { address: { contains: search, mode: "insensitive" as const } },
      { member: { user: { OR: [{ firstName: { contains: search, mode: "insensitive" as const } }, { lastName: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] } } },
      { categories: { some: { category: { name: { contains: search, mode: "insensitive" as const } } } } },
    ] });
    const where = clauses.length ? { AND: clauses } : {};
    const [total, records, totalBusinesses, pendingReview, approved, rejected, suspended] = await Promise.all([
      prisma.business.count({ where }),
      prisma.business.findMany({ where, select: summary, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (filter.page - 1) * filter.pageSize, take: filter.pageSize }),
      prisma.business.count(), prisma.business.count({ where: { publicationStatus: "pending_review" } }),
      prisma.business.count({ where: { publicationStatus: "approved" } }), prisma.business.count({ where: { publicationStatus: "rejected" } }),
      prisma.business.count({ where: { publicationStatus: "suspended" } }),
    ]);
    return { summary: { totalBusinesses, pendingReview, approved, rejected, suspended }, rows: records.map(mapBusiness), total, page: filter.page, pageSize: filter.pageSize };
  }

  async categories() {
    return prisma.businessCategory.findMany({ orderBy: [{ name: "asc" }, { id: "asc" }], select: { id: true, name: true } });
  }

  async owners() {
    const owners = await prisma.member.findMany({ where: { user: { status: "ACTIVE", deletedAt: null } }, orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }], select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } });
    return owners.map((owner) => ({ id: owner.id, name: [owner.user.firstName, owner.user.lastName].filter(Boolean).join(" "), email: owner.user.email }));
  }

  async create(actorId: string, input: AdminBusinessWriteInput) {
    const [owner, categoryCount] = await Promise.all([
      prisma.member.findFirst({ where: { id: input.memberId, user: { status: "ACTIVE", deletedAt: null } }, select: { id: true } }),
      prisma.businessCategory.count({ where: { id: { in: input.categoryIds } } }),
    ]);
    if (!owner || categoryCount !== new Set(input.categoryIds).size) throw new Error("BUSINESS_OWNER_OR_CATEGORY_INVALID");
    const base = input.name.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 250) || "business";
    const created = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({ data: { memberId: owner.id, name: input.name, slug: `${base}-${randomUUID().slice(0, 8)}`, description: input.description, address: input.address, websiteUrl: input.websiteUrl, email: input.email, phone: input.phone, status: "active", publicationStatus: "pending_review", categories: { create: input.categoryIds.map((categoryId) => ({ category: { connect: { id: categoryId } } })) } }, select: { id: true } });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_BUSINESS_CREATED", entityType: "Business", entityId: business.id, details: { ownerMemberId: owner.id, publicationStatus: "pending_review" } } });
      return business;
    });
    return this.get(created.id);
  }

  async update(id: string, actorId: string, input: AdminBusinessUpdateInput) {
    const [current, categoryCount] = await Promise.all([
      prisma.business.findUnique({ where: { id }, select: { publicationStatus: true, status: true } }),
      prisma.businessCategory.count({ where: { id: { in: input.categoryIds } } }),
    ]);
    if (!current) return null;
    if (categoryCount !== new Set(input.categoryIds).size) throw new Error("BUSINESS_CATEGORY_INVALID");
    await prisma.$transaction(async (tx) => {
      const updated = await tx.business.updateMany({ where: { id, publicationStatus: current.publicationStatus }, data: { name: input.name, description: input.description, address: input.address, websiteUrl: input.websiteUrl, email: input.email, phone: input.phone, publicationStatus: "pending_review" } });
      if (updated.count !== 1) throw new Error("BUSINESS_STATE_CHANGED");
      await tx.businessCategoryAssignment.deleteMany({ where: { businessId: id } });
      if (input.categoryIds.length) await tx.businessCategoryAssignment.createMany({ data: input.categoryIds.map((categoryId) => ({ businessId: id, categoryId })) });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_BUSINESS_UPDATED", entityType: "Business", entityId: id, details: { previousPublicationStatus: current.publicationStatus, publicationStatus: "pending_review", operationalStatus: current.status } } });
    });
    return this.get(id);
  }

  async get(id: string) {
    const record = await prisma.business.findUnique({ where: { id }, select: {
      ...summary, description: true, websiteUrl: true, email: true, phone: true,
      media: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true, mediaType: true, caption: true, sortOrder: true } },
      reviews: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, reviewStatus: true, reviewComment: true, reviewedAt: true, createdAt: true, reviewer: { select: { firstName: true, lastName: true, email: true } } } },
    } });
    if (!record) return null;
    return { ...mapBusiness(record), description: record.description, websiteUrl: record.websiteUrl, email: record.email, phone: record.phone,
      media: record.media.map((item) => ({ id: item.id, mediaType: item.mediaType, caption: item.caption, sortOrder: item.sortOrder })),
      reviews: record.reviews.map((review) => ({ id: review.id, status: review.reviewStatus, reason: review.reviewComment, reviewedAt: review.reviewedAt?.toISOString() ?? review.createdAt.toISOString(), reviewerName: review.reviewer ? [review.reviewer.firstName, review.reviewer.lastName].filter(Boolean).join(" ") : "Former reviewer" })) };
  }

  async review(id: string, actorId: string, input: AdminBusinessReviewInput) {
    const current = await prisma.business.findUnique({ where: { id }, select: { publicationStatus: true, status: true, name: true, member: { select: { userId: true } } } });
    if (!current) return null;
    if (!canReviewBusinessTransition(current.publicationStatus, input.status)) throw new Error("BUSINESS_REVIEW_TRANSITION_INVALID");
    try {
      await prisma.$transaction(async (tx) => {
        const updated = await tx.business.updateMany({ where: { id, publicationStatus: current.publicationStatus }, data: { publicationStatus: input.status } });
        if (updated.count !== 1) throw new Error("BUSINESS_REVIEW_STATE_CHANGED");
        await tx.businessReview.create({ data: { businessId: id, reviewerUserId: actorId, reviewStatus: input.status, reviewComment: input.reason, reviewedAt: new Date() } });
        await tx.notification.create({ data: { userId: current.member.userId, title: "Business listing reviewed", body: `${current.name} was ${input.status}.${input.reason ? ` ${input.reason}` : ""}`, notificationType: "business" } });
        await tx.auditLog.create({ data: { actorUserId: actorId, action: `ADMIN_BUSINESS_${input.status.toUpperCase()}`, entityType: "Business", entityId: id, details: { previousPublicationStatus: current.publicationStatus, publicationStatus: input.status, operationalStatus: current.status, reason: input.reason } } });
      });
    } catch (error) { if (error instanceof Error && error.message === "BUSINESS_REVIEW_STATE_CHANGED") throw error; throw error; }
    return this.get(id);
  }
}
