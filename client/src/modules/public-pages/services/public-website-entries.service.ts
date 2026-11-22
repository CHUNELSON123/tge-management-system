export type PublicEntryKind = "blog" | "testimonial" | "faq";
export interface PublicWebsiteEntry { slug: string; title: string; summary: string | null; content: string; publishedAt: string }
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export async function getPublicEntries(kind: PublicEntryKind, slug?: string, signal?: AbortSignal): Promise<PublicWebsiteEntry[] | PublicWebsiteEntry> {
  const response = await fetch(`${API}/api/public/website-content/${kind}${slug ? `/${encodeURIComponent(slug)}` : ""}`, { signal, cache: "no-store" });
  const body = await response.json().catch(() => null) as { data?: PublicWebsiteEntry[] | PublicWebsiteEntry } | null;
  if (!response.ok || !body?.data) throw new Error("Content is unavailable.");
  return body.data;
}
