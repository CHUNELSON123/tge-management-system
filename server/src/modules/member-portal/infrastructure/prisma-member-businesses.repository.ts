import { randomUUID } from "node:crypto";
import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { MemberBusiness, MemberBusinessesRepository, MemberBusinessInput } from "../domain/member-businesses.repository.js";

export class PrismaMemberBusinessesRepository implements MemberBusinessesRepository {
  constructor(private readonly database = prisma) {}

  async findForUser(userId: string): Promise<MemberBusiness[] | null> {
    const member = await this.database.member.findUnique({ where: { userId }, select: {
      businesses: { orderBy: [{ createdAt: "desc" }, { id: "asc" }], select: {
        id: true, name: true, slug: true, description: true, status: true, publicationStatus: true, address: true, websiteUrl: true, email: true, phone: true,
        reviews: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1, select: { reviewStatus: true, reviewComment: true } },
        categories: { orderBy: { category: { name: "asc" } }, select: { category: { select: { id: true, name: true } } } },
      } },
    } });
    if (!member) return null;
    return member.businesses.map((business) => ({
      id: business.id, name: business.name, slug: business.slug, description: business.description,
      status: business.status, publicationStatus: business.publicationStatus,
      reviewReason: business.reviews[0]?.reviewStatus === business.publicationStatus ? business.reviews[0].reviewComment : null,
      categories: business.categories.map(({ category }) => category.name), categoryAssignments: business.categories.map(({ category }) => category),
      address: business.address, websiteUrl: business.websiteUrl, email: business.email, phone: business.phone,
    }));
  }

  categories() { return this.database.businessCategory.findMany({ orderBy: [{ name: "asc" }, { id: "asc" }], select: { id: true, name: true } }); }

  async saveForUser(userId: string, input: MemberBusinessInput, id?: string): Promise<MemberBusiness | null> {
    const member = await this.database.member.findUnique({ where: { userId }, select: { id: true, membershipStatus: true } });
    if (!member) return null;
    if (!id && member.membershipStatus !== "active") throw new Error("ACTIVE_MEMBERSHIP_REQUIRED");
    const categoryCount = await this.database.businessCategory.count({ where: { id: { in: input.categoryIds } } });
    if (categoryCount !== new Set(input.categoryIds).size) throw new Error("BUSINESS_CATEGORY_INVALID");
    let businessId: string;
    if (id) {
      const owned = await this.database.business.findFirst({ where: { id, memberId: member.id }, select: { id: true, publicationStatus: true } });
      if (!owned) return null;
      businessId = owned.id;
      await this.database.$transaction(async (tx) => {
        const updated = await tx.business.updateMany({ where: { id, memberId: member.id, publicationStatus: owned.publicationStatus }, data: { name: input.name, description: input.description, address: input.address, websiteUrl: input.websiteUrl, email: input.email, phone: input.phone, publicationStatus: "pending_review" } });
        if (updated.count !== 1) throw new Error("BUSINESS_STATE_CHANGED");
        await tx.businessCategoryAssignment.deleteMany({ where: { businessId } });
        if (input.categoryIds.length) await tx.businessCategoryAssignment.createMany({ data: input.categoryIds.map((categoryId) => ({ businessId, categoryId })) });
        await tx.auditLog.create({ data: { actorUserId: userId, action: "MEMBER_BUSINESS_UPDATED", entityType: "Business", entityId: businessId, details: { publicationStatus: "pending_review" } } });
      });
    } else {
      const base = input.name.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 250) || "business";
      const slug = `${base}-${randomUUID().slice(0, 8)}`;
      const created = await this.database.$transaction(async (tx) => {
        const business = await tx.business.create({ data: { memberId: member.id, name: input.name, slug, description: input.description, address: input.address, websiteUrl: input.websiteUrl, email: input.email, phone: input.phone, status: "active", publicationStatus: "pending_review", categories: { create: input.categoryIds.map((categoryId) => ({ category: { connect: { id: categoryId } } })) } }, select: { id: true } });
        await tx.auditLog.create({ data: { actorUserId: userId, action: "MEMBER_BUSINESS_CREATED", entityType: "Business", entityId: business.id, details: { publicationStatus: "pending_review" } } });
        return business;
      });
      businessId = created.id;
    }
    const saved = await this.database.business.findUnique({ where: { id: businessId }, select: { id: true, name: true, slug: true, description: true, status: true, publicationStatus: true, address: true, websiteUrl: true, email: true, phone: true, categories: { orderBy: { category: { name: "asc" } }, select: { category: { select: { id: true, name: true } } } } } });
    if (!saved) return null;
    return { id: saved.id, name: saved.name, slug: saved.slug, description: saved.description, status: saved.status, publicationStatus: saved.publicationStatus, reviewReason: null, address: saved.address, websiteUrl: saved.websiteUrl, email: saved.email, phone: saved.phone, categories: saved.categories.map(({ category }) => category.name), categoryAssignments: saved.categories.map(({ category }) => category) };
  }
}
