import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { AdminWebsiteRepository, WebsiteContentDetail, WebsiteContentFilter, WebsiteContentPage, WebsiteContentRow, WebsiteContentType, WebsiteNewsInput, WebsitePageInput, WebsiteStatus } from "../domain/admin-website.repository.js";
import { canTransitionWebsiteContent } from "../domain/website-content-lifecycle.js";

function displayName(user: { firstName: string; lastName: string } | null | undefined) { return user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "Former user"; }
function pageWhere(filter: WebsiteContentFilter) { const search = filter.search?.trim(); return { ...(filter.status ? { status: filter.status } : {}), ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" as const } }, { slug: { contains: search, mode: "insensitive" as const } }] } : {}) }; }
function newsWhere(filter: WebsiteContentFilter) { const search = filter.search?.trim(); return { ...(filter.status ? { status: filter.status } : {}), ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" as const } }, { slug: { contains: search, mode: "insensitive" as const } }, { summary: { contains: search, mode: "insensitive" as const } }] } : {}) }; }
type UserName = { firstName: string; lastName: string } | null;
type PageRow = { id: string; slug: string; title: string; status: string; publishedAt: Date | null; createdAt: Date; updatedAt: Date; createdBy: UserName; updatedBy: UserName; content?: string };
type NewsRow = { id: string; slug: string; title: string; summary: string | null; status: string; publishedAt: Date | null; createdAt: Date; updatedAt: Date; author: UserName; updatedBy: UserName; content?: string };
function asPageRow(row: PageRow): WebsiteContentRow { return { id: row.id, type: "page", slug: row.slug, title: row.title, summary: null, status: row.status, publishedAt: row.publishedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), authorName: displayName(row.createdBy), updatedByName: row.updatedBy ? displayName(row.updatedBy) : null }; }
function asNewsRow(row: NewsRow): WebsiteContentRow { return { id: row.id, type: "news", slug: row.slug, title: row.title, summary: row.summary, status: row.status, publishedAt: row.publishedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), authorName: displayName(row.author), updatedByName: row.updatedBy ? displayName(row.updatedBy) : null }; }
function asPageDetail(row: PageRow & { content: string }): WebsiteContentDetail { return { ...asPageRow(row), content: row.content }; }
function asNewsDetail(row: NewsRow & { content: string }): WebsiteContentDetail { return { ...asNewsRow(row), content: row.content }; }
type EntryRow = { id: string; kind: string; slug: string; title: string; summary: string | null; content?: string; status: string; publishedAt: Date | null; createdAt: Date; updatedAt: Date; createdBy: UserName; updatedBy: UserName };
type MediaRow = { id: string; title: string; status: string; publishedAt: Date | null; createdAt: Date; updatedAt: Date; createdBy: UserName; updatedBy: UserName };
function asEntryRow(row: EntryRow): WebsiteContentRow { return { id: row.id, type: row.kind as "blog" | "testimonial" | "faq", slug: row.slug, title: row.title, summary: row.summary, status: row.status, publishedAt: row.publishedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), authorName: displayName(row.createdBy), updatedByName: row.updatedBy ? displayName(row.updatedBy) : null }; }
function asMediaRow(row: MediaRow): WebsiteContentRow { return { id: row.id, type: "media", slug: row.id, title: row.title, summary: null, status: row.status, publishedAt: row.publishedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), authorName: displayName(row.createdBy), updatedByName: row.updatedBy ? displayName(row.updatedBy) : null }; }

const pageSummarySelect = { id: true, slug: true, title: true, status: true, publishedAt: true, createdAt: true, updatedAt: true, createdBy: { select: { firstName: true, lastName: true } }, updatedBy: { select: { firstName: true, lastName: true } } } as const;
const newsSummarySelect = { id: true, slug: true, title: true, summary: true, status: true, publishedAt: true, createdAt: true, updatedAt: true, author: { select: { firstName: true, lastName: true } }, updatedBy: { select: { firstName: true, lastName: true } } } as const;
const entrySummarySelect = { id: true, kind: true, slug: true, title: true, summary: true, status: true, publishedAt: true, createdAt: true, updatedAt: true, createdBy: { select: { firstName: true, lastName: true } }, updatedBy: { select: { firstName: true, lastName: true } } } as const;
const mediaSummarySelect = { id: true, title: true, status: true, publishedAt: true, createdAt: true, updatedAt: true, createdBy: { select: { firstName: true, lastName: true } }, updatedBy: { select: { firstName: true, lastName: true } } } as const;

export class PrismaAdminWebsiteRepository implements AdminWebsiteRepository {
  async list(filter: WebsiteContentFilter): Promise<WebsiteContentPage> {
    const pageFilter = !filter.type || filter.type === "page" ? pageWhere(filter) : null;
    const newsFilter = !filter.type || filter.type === "news" ? newsWhere(filter) : null;
    const entriesEnabled = !filter.type || ["blog", "testimonial", "faq"].includes(filter.type);
    const mediaEnabled = !filter.type || filter.type === "media";
    const entryFilter = { ...pageWhere(filter), ...(filter.type && entriesEnabled ? { kind: filter.type } : {}) };
    const mediaFilter = { ...(filter.status ? { status: filter.status } : {}), ...(filter.search ? { title: { contains: filter.search, mode: "insensitive" as const } } : {}) };
    const offset = (filter.page - 1) * filter.pageSize;
    const [totalPages, totalNews, publishedPages, publishedNews, draftPages, draftNews, archivedPages, archivedNews, pageCount, newsCount, pageRows, newsRows, totalMedia, publishedEntries, publishedMedia, draftEntries, draftMedia, archivedEntries, archivedMedia, entryCount, mediaCount, entryRows, mediaRows] = await Promise.all([
      prisma.page.count(), prisma.news.count(), prisma.page.count({ where: { status: "published" } }), prisma.news.count({ where: { status: "published" } }),
      prisma.page.count({ where: { status: "draft" } }), prisma.news.count({ where: { status: "draft" } }), prisma.page.count({ where: { status: "archived" } }), prisma.news.count({ where: { status: "archived" } }),
      pageFilter ? prisma.page.count({ where: pageFilter }) : Promise.resolve(0), newsFilter ? prisma.news.count({ where: newsFilter }) : Promise.resolve(0),
      pageFilter ? prisma.page.findMany({ where: pageFilter, select: pageSummarySelect, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], ...(filter.type ? { skip: offset } : {}), take: filter.type ? filter.pageSize : offset + filter.pageSize }) : Promise.resolve([]),
      newsFilter ? prisma.news.findMany({ where: newsFilter, select: newsSummarySelect, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], ...(filter.type ? { skip: offset } : {}), take: filter.type ? filter.pageSize : offset + filter.pageSize }) : Promise.resolve([]),
      prisma.websiteMedia.count(), prisma.websiteEntry.count({ where: { status: "published" } }), prisma.websiteMedia.count({ where: { status: "published" } }), prisma.websiteEntry.count({ where: { status: "draft" } }), prisma.websiteMedia.count({ where: { status: "draft" } }), prisma.websiteEntry.count({ where: { status: "archived" } }), prisma.websiteMedia.count({ where: { status: "archived" } }),
      entriesEnabled ? prisma.websiteEntry.count({ where: entryFilter }) : Promise.resolve(0), mediaEnabled ? prisma.websiteMedia.count({ where: mediaFilter }) : Promise.resolve(0),
      entriesEnabled ? prisma.websiteEntry.findMany({ where: entryFilter, select: entrySummarySelect, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], ...(filter.type ? { skip: offset } : {}), take: filter.type ? filter.pageSize : offset + filter.pageSize }) : Promise.resolve([]),
      mediaEnabled ? prisma.websiteMedia.findMany({ where: mediaFilter, select: mediaSummarySelect, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], ...(filter.type ? { skip: offset } : {}), take: filter.type ? filter.pageSize : offset + filter.pageSize }) : Promise.resolve([]),
    ]);
    const rows = [...pageRows.map(asPageRow), ...newsRows.map(asNewsRow), ...entryRows.map(asEntryRow), ...mediaRows.map(asMediaRow)].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.id.localeCompare(right.id)).slice(filter.type ? 0 : offset, filter.type ? filter.pageSize : offset + filter.pageSize);
    return { summary: { totalPages, totalNews, totalMedia, published: publishedPages + publishedNews + publishedEntries + publishedMedia, drafts: draftPages + draftNews + draftEntries + draftMedia, archived: archivedPages + archivedNews + archivedEntries + archivedMedia }, rows, total: pageCount + newsCount + entryCount + mediaCount, page: filter.page, pageSize: filter.pageSize };
  }

  async getPage(id: string) { const row = await prisma.page.findUnique({ where: { id }, select: { ...pageSummarySelect, content: true } }); return row ? asPageDetail(row) : null; }
  async getNews(id: string) { const row = await prisma.news.findUnique({ where: { id }, select: { ...newsSummarySelect, content: true } }); return row ? asNewsDetail(row) : null; }
  async getEntry(type: "blog" | "testimonial" | "faq", id: string) { const row = await prisma.websiteEntry.findFirst({ where: { id, kind: type }, select: { ...entrySummarySelect, content: true } }); return row ? { ...asEntryRow(row), content: row.content } : null; }
  async createEntry(type: "blog" | "testimonial" | "faq", input: WebsitePageInput & { summary?: string }, actorId: string) {
    const row = await prisma.$transaction(async tx => {
      const entry = await tx.websiteEntry.create({ data: { kind: type, ...input, status: "draft", createdByUserId: actorId, updatedByUserId: actorId }, select: { id: true } });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_WEBSITE_ENTRY_CREATED", entityType: "WebsiteEntry", entityId: entry.id, details: { type, status: "draft" } } });
      return entry;
    });
    return (await this.getEntry(type, row.id))!;
  }
  async updateEntry(type: "blog" | "testimonial" | "faq", id: string, input: WebsitePageInput & { summary?: string }, actorId: string) {
    const current = await prisma.websiteEntry.findFirst({ where: { id, kind: type }, select: { status: true } }); if (!current) return null;
    await prisma.$transaction(async tx => {
      const result = await tx.websiteEntry.updateMany({ where: { id, kind: type, status: current.status }, data: { ...input, updatedByUserId: actorId } });
      if (result.count !== 1) throw new Error("WEBSITE_CONTENT_CHANGED");
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_WEBSITE_ENTRY_UPDATED", entityType: "WebsiteEntry", entityId: id, details: { type, status: current.status } } });
    });
    return this.getEntry(type, id);
  }
  async createMedia(title: string, contentType: string, data: Uint8Array, actorId: string) {
    const row = await prisma.$transaction(async tx => {
      const item = await tx.websiteMedia.create({ data: { title, contentType, data: new Uint8Array(data), status: "draft", createdByUserId: actorId, updatedByUserId: actorId }, select: { id: true } });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_WEBSITE_MEDIA_CREATED", entityType: "WebsiteMedia", entityId: item.id } });
      return item;
    });
    return (await this.getMedia(row.id))!;
  }
  async getMedia(id: string) { const row = await prisma.websiteMedia.findUnique({ where: { id }, select: mediaSummarySelect }); return row ? { ...asMediaRow(row), content: "" } : null; }
  async getMediaFile(id: string) { return prisma.websiteMedia.findUnique({ where: { id }, select: { data: true, contentType: true } }); }

  async createPage(input: WebsitePageInput, actorId: string) {
    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.page.create({ data: { slug: input.slug, title: input.title, content: input.content, status: "draft", createdByUserId: actorId, updatedByUserId: actorId }, select: { id: true } });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_PAGE_CREATED", entityType: "Page", entityId: row.id, details: { status: "draft", slug: input.slug } } });
      return row;
    });
    return (await this.getPage(created.id))!;
  }

  async updatePage(id: string, input: WebsitePageInput, actorId: string) {
    const current = await prisma.page.findUnique({ where: { id }, select: { status: true } }); if (!current) return null;
    await prisma.$transaction(async (tx) => {
      const update = await tx.page.updateMany({ where: { id, status: current.status }, data: { slug: input.slug, title: input.title, content: input.content, updatedByUserId: actorId } });
      if (update.count !== 1) throw new Error("WEBSITE_CONTENT_CHANGED");
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_PAGE_UPDATED", entityType: "Page", entityId: id, details: { status: current.status, slug: input.slug } } });
    });
    return this.getPage(id);
  }

  async createNews(input: WebsiteNewsInput, actorId: string) {
    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.news.create({ data: { slug: input.slug, title: input.title, summary: input.summary, content: input.content, status: "draft", authorUserId: actorId, updatedByUserId: actorId }, select: { id: true } });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_NEWS_CREATED", entityType: "News", entityId: row.id, details: { status: "draft", slug: input.slug } } });
      return row;
    });
    return (await this.getNews(created.id))!;
  }

  async updateNews(id: string, input: WebsiteNewsInput, actorId: string) {
    const current = await prisma.news.findUnique({ where: { id }, select: { status: true } }); if (!current) return null;
    await prisma.$transaction(async (tx) => {
      const update = await tx.news.updateMany({ where: { id, status: current.status }, data: { slug: input.slug, title: input.title, summary: input.summary, content: input.content, updatedByUserId: actorId } });
      if (update.count !== 1) throw new Error("WEBSITE_CONTENT_CHANGED");
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_NEWS_UPDATED", entityType: "News", entityId: id, details: { status: current.status, slug: input.slug } } });
    });
    return this.getNews(id);
  }

  async transition(type: WebsiteContentType, id: string, status: WebsiteStatus, actorId: string) {
    const current = type === "page" ? await prisma.page.findUnique({ where: { id }, select: { status: true } }) : type === "news" ? await prisma.news.findUnique({ where: { id }, select: { status: true } }) : type === "media" ? await prisma.websiteMedia.findUnique({ where: { id }, select: { status: true } }) : await prisma.websiteEntry.findFirst({ where: { id, kind: type }, select: { status: true } });
    if (!current) return null;
    if (!canTransitionWebsiteContent(current.status, status)) throw new Error("WEBSITE_TRANSITION_INVALID");
    const publishedAt = status === "published" ? new Date() : null;
    await prisma.$transaction(async (tx) => {
      const update = type === "page"
        ? await tx.page.updateMany({ where: { id, status: current.status }, data: { status, publishedAt, updatedByUserId: actorId } })
        : type === "news" ? await tx.news.updateMany({ where: { id, status: current.status }, data: { status, publishedAt, updatedByUserId: actorId } }) : type === "media" ? await tx.websiteMedia.updateMany({ where: { id, status: current.status }, data: { status, publishedAt, updatedByUserId: actorId } }) : await tx.websiteEntry.updateMany({ where: { id, kind: type, status: current.status }, data: { status, publishedAt, updatedByUserId: actorId } });
      if (update.count !== 1) throw new Error("WEBSITE_CONTENT_CHANGED");
      await tx.auditLog.create({ data: { actorUserId: actorId, action: `ADMIN_${type.toUpperCase()}_${status.toUpperCase()}`, entityType: type === "page" ? "Page" : type === "news" ? "News" : type === "media" ? "WebsiteMedia" : "WebsiteEntry", entityId: id, details: { previousStatus: current.status, status } } });
    });
    return type === "page" ? this.getPage(id) : type === "news" ? this.getNews(id) : type === "media" ? this.getMedia(id) : this.getEntry(type, id);
  }
}
