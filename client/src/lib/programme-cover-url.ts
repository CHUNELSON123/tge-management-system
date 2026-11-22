const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function programmeCoverUrl(url: string): string {
  return url.startsWith("/api/public/website-media/") ? `${API_URL}${url}` : url;
}
