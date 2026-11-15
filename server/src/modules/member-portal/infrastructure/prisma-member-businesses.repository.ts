import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { MemberBusiness, MemberBusinessesRepository } from "../domain/member-businesses.repository.js";

export class PrismaMemberBusinessesRepository implements MemberBusinessesRepository {
  constructor(private readonly database = prisma) {}

  async findForUser(userId: string): Promise<MemberBusiness[] | null> {
    const member = await this.database.member.findUnique({ where: { userId }, select: {
      businesses: { orderBy: [{ createdAt: "desc" }, { id: "asc" }], select: {
        id: true, name: true, slug: true, description: true, status: true, publicationStatus: true,
        categories: { select: { category: { select: { name: true } } } },
      } },
    } });
    if (!member) return null;
    return member.businesses.map((business) => ({
      id: business.id, name: business.name, slug: business.slug, description: business.description,
      status: business.status, publicationStatus: business.publicationStatus,
      categories: business.categories.map(({ category }) => category.name),
    }));
  }
}
