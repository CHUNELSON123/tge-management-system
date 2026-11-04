import { prisma } from "../../../infrastructure/database/prisma-client.js";
import { ACTIVE_BUSINESS_STATUS, APPROVED_BUSINESS_PUBLICATION_STATUS } from "../application/public-content-policy.js";
import type { PublicBusinessDetails, PublicBusinessPage, PublicBusinessQuery, PublicBusinessRepository, PublicBusinessSummary } from "../application/get-public-businesses.usecase.js";

const publicBusinessWhere = { status: ACTIVE_BUSINESS_STATUS, publicationStatus: APPROVED_BUSINESS_PUBLICATION_STATUS };
const summaryFields = {
  id: true, slug: true, name: true, description: true, address: true,
  categories: { select: { category: { select: { id: true, name: true } } }, orderBy: { category: { name: "asc" } } },
} as const;

function toSummary(record: {
  id: string; slug: string; name: string; description: string | null; address: string | null;
  categories: { category: { id: string; name: string } }[];
}): PublicBusinessSummary {
  return { id: record.id, slug: record.slug, name: record.name, description: record.description, address: record.address, categories: record.categories.map(({ category }) => ({ id: category.id, name: category.name })) };
}

export function safePublicBusinessWebsite(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}

export class PrismaPublicBusinessesRepository implements PublicBusinessRepository {
  constructor(private readonly database = prisma) {}

  async listApprovedBusinesses(query: PublicBusinessQuery): Promise<PublicBusinessPage> {
    const where = {
      ...publicBusinessWhere,
      ...(query.q ? { OR: [
        { name: { contains: query.q, mode: "insensitive" as const } },
        { description: { contains: query.q, mode: "insensitive" as const } },
        { categories: { some: { category: { name: { contains: query.q, mode: "insensitive" as const } } } } },
      ] } : {}),
      ...(query.categoryId ? { categories: { some: { categoryId: query.categoryId } } } : {}),
    };
    const [total, records] = await this.database.$transaction([
      this.database.business.count({ where }),
      this.database.business.findMany({
        where,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: summaryFields,
      }),
    ], { isolationLevel: "RepeatableRead" });
    return { items: records.map(toSummary), total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) };
  }

  async listPublicCategories() {
    const records = await this.database.businessCategory.findMany({
      where: { businesses: { some: { business: publicBusinessWhere } } },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true, _count: { select: { businesses: { where: { business: publicBusinessWhere } } } } },
    });
    return records.map((record) => ({ id: record.id, name: record.name, count: record._count.businesses }));
  }

  async findApprovedBusinessBySlug(slug: string): Promise<PublicBusinessDetails | null> {
    const record = await this.database.business.findFirst({
      where: { slug, ...publicBusinessWhere },
      select: { ...summaryFields, websiteUrl: true, email: true, phone: true },
    });
    if (!record) return null;
    return {
      ...toSummary(record), websiteUrl: safePublicBusinessWebsite(record.websiteUrl),
      email: record.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email) ? record.email : null,
      phone: record.phone && /^\+?[\d\s().-]{5,30}$/.test(record.phone) ? record.phone : null,
    };
  }
}
