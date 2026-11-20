import type { AdminWebsiteRepository, WebsiteContentFilter, WebsiteContentType, WebsitePageInput, WebsiteNewsInput, WebsiteStatus } from "../domain/admin-website.repository.js";
export class ManageAdminWebsiteUseCase {
  constructor(private readonly repository: AdminWebsiteRepository) {}
  list(filter: WebsiteContentFilter) { return this.repository.list(filter); }
  get(type: WebsiteContentType, id: string) { return type === "page" ? this.repository.getPage(id) : type === "news" ? this.repository.getNews(id) : type === "media" ? this.repository.getMedia(id) : this.repository.getEntry(type, id); }
  createPage(input: WebsitePageInput, actorId: string) { return this.repository.createPage(input, actorId); }
  updatePage(id: string, input: WebsitePageInput, actorId: string) { return this.repository.updatePage(id, input, actorId); }
  createNews(input: WebsiteNewsInput, actorId: string) { return this.repository.createNews(input, actorId); }
  updateNews(id: string, input: WebsiteNewsInput, actorId: string) { return this.repository.updateNews(id, input, actorId); }
  createEntry(type: "blog" | "testimonial" | "faq", input: WebsitePageInput & { summary?: string }, actorId: string) { return this.repository.createEntry(type, input, actorId); }
  updateEntry(type: "blog" | "testimonial" | "faq", id: string, input: WebsitePageInput & { summary?: string }, actorId: string) { return this.repository.updateEntry(type, id, input, actorId); }
  createMedia(title: string, contentType: string, data: Uint8Array, actorId: string) { return this.repository.createMedia(title, contentType, data, actorId); }
  getMediaFile(id: string) { return this.repository.getMediaFile(id); }
  transition(type: WebsiteContentType, id: string, status: WebsiteStatus, actorId: string) { return this.repository.transition(type, id, status, actorId); }
}
