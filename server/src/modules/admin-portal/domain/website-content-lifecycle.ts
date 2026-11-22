import type { WebsiteStatus } from "./admin-website.repository.js";
export function canTransitionWebsiteContent(current: string, next: WebsiteStatus): boolean {
  return (current === "draft" && (next === "published" || next === "archived"))
    || (current === "published" && (next === "draft" || next === "archived"))
    || (current === "archived" && next === "draft");
}
