export type WebsiteType = "page" | "news" | "blog" | "testimonial" | "faq" | "media";
export type WebsiteStatus = "draft" | "published" | "archived";
export interface WebsiteRow { id: string; type: WebsiteType; slug: string; title: string; summary: string | null; status: WebsiteStatus; publishedAt: string | null; createdAt: string; updatedAt: string; authorName: string; updatedByName: string | null }
export interface WebsiteDetail extends WebsiteRow { content: string }
export interface WebsiteList { summary: { totalPages: number; totalNews: number; totalMedia: number; published: number; drafts: number; archived: number }; rows: WebsiteRow[]; total: number; page: number; pageSize: number }
