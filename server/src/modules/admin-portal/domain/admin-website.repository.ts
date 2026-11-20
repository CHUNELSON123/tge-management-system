export type WebsiteStatus = "draft" | "published" | "archived";
export type WebsiteContentType = "page" | "news" | "blog" | "testimonial" | "faq" | "media";
export interface WebsiteContentFilter { search?: string; type?: WebsiteContentType; status?: WebsiteStatus; page: number; pageSize: number }
export interface WebsiteContentRow { id: string; type: WebsiteContentType; slug: string; title: string; summary: string | null; status: string; publishedAt: string | null; createdAt: string; updatedAt: string; authorName: string; updatedByName: string | null }
export interface WebsiteContentDetail extends WebsiteContentRow { content: string }
export interface WebsiteContentPage { summary: { totalPages: number; totalNews: number; totalMedia: number; published: number; drafts: number; archived: number }; rows: WebsiteContentRow[]; total: number; page: number; pageSize: number }
export interface WebsitePageInput { slug: string; title: string; content: string }
export interface WebsiteNewsInput extends WebsitePageInput { summary: string }
export interface AdminWebsiteRepository {
  list(filter: WebsiteContentFilter): Promise<WebsiteContentPage>;
  getPage(id: string): Promise<WebsiteContentDetail | null>;
  getNews(id: string): Promise<WebsiteContentDetail | null>;
  createPage(input: WebsitePageInput, actorId: string): Promise<WebsiteContentDetail>;
  updatePage(id: string, input: WebsitePageInput, actorId: string): Promise<WebsiteContentDetail | null>;
  createNews(input: WebsiteNewsInput, actorId: string): Promise<WebsiteContentDetail>;
  updateNews(id: string, input: WebsiteNewsInput, actorId: string): Promise<WebsiteContentDetail | null>;
  getEntry(type: "blog" | "testimonial" | "faq", id: string): Promise<WebsiteContentDetail | null>;
  createEntry(type: "blog" | "testimonial" | "faq", input: WebsitePageInput & { summary?: string }, actorId: string): Promise<WebsiteContentDetail>;
  updateEntry(type: "blog" | "testimonial" | "faq", id: string, input: WebsitePageInput & { summary?: string }, actorId: string): Promise<WebsiteContentDetail | null>;
  createMedia(title: string, contentType: string, data: Uint8Array, actorId: string): Promise<WebsiteContentDetail>;
  getMedia(id: string): Promise<WebsiteContentDetail | null>;
  getMediaFile(id: string): Promise<{ data: Uint8Array; contentType: string } | null>;
  transition(type: WebsiteContentType, id: string, status: WebsiteStatus, actorId: string): Promise<WebsiteContentDetail | null>;
}
