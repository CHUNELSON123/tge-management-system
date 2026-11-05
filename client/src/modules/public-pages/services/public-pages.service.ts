export interface PublicPreviewItem {
  title: string;
  href: string;
  summary?: string | null;
  date?: string | null;
  category?: string | null;
}

export interface HomePreviews {
  programmes: PublicPreviewItem[];
  events: PublicPreviewItem[];
  businesses: PublicPreviewItem[];
  news: PublicPreviewItem[];
}

export interface PublicProgramme {
  name: string;
  slug: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface PublicEvent {
  id: string;
  title: string;
  eventType: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  timezone: string | null;
  venue: string | null;
}

export interface PublicEventsList {
  upcoming: PublicEvent[];
  past: PublicEvent[];
}

export interface PublicEventDetails extends PublicEvent {
  isUpcoming: boolean;
  relatedEvents: PublicEvent[];
}

export interface PublicGalleryItem {
  id: string;
  eventId: string;
  eventTitle: string;
  url: string;
  altText: string;
}

export interface PublicNewsArticle {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  publishedAt: string;
}

export class PublicNewsNotFoundError extends Error {
  constructor() { super("Article not found."); this.name = "PublicNewsNotFoundError"; }
}

export class PublicEventNotFoundError extends Error {
  constructor() {
    super("Event not found.");
    this.name = "PublicEventNotFoundError";
  }
}

interface HomePreviewsResponse {
  message: string;
  data: HomePreviews;
}

interface ProgrammesResponse {
  message: string;
  data: PublicProgramme[];
}

interface EventsResponse {
  message: string;
  data: PublicEventsList;
}

interface EventDetailsResponse {
  message: string;
  data: PublicEventDetails;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const publicPagesService = {
  async getHomePreviews(signal?: AbortSignal): Promise<HomePreviews> {
    const response = await fetch(`${API_URL}/api/public/home-previews`, {
      method: "GET",
      cache: "no-store",
      signal,
    });

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new Error("Public content is temporarily unavailable.");
    }

    if (!response.ok || !body || typeof body !== "object" || !("data" in body)) {
      throw new Error("Public content is temporarily unavailable.");
    }

    const data = (body as HomePreviewsResponse).data;
    if (!data || !Array.isArray(data.programmes) || !Array.isArray(data.events) || !Array.isArray(data.businesses) || !Array.isArray(data.news)) {
      throw new Error("Public content response is invalid.");
    }

    return data;
  },

  async getProgrammes(signal?: AbortSignal): Promise<PublicProgramme[]> {
    const response = await fetch(`${API_URL}/api/public/programmes`, {
      method: "GET",
      cache: "no-store",
      signal,
    });

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new Error("Programmes are temporarily unavailable.");
    }

    if (!response.ok || !body || typeof body !== "object" || !("data" in body) || !Array.isArray((body as ProgrammesResponse).data)) {
      throw new Error("Programmes are temporarily unavailable.");
    }

    return (body as ProgrammesResponse).data.filter((item) =>
      item && typeof item.name === "string" && typeof item.slug === "string" &&
      (typeof item.description === "string" || item.description === null) &&
      (typeof item.startDate === "string" || item.startDate === null) &&
      (typeof item.endDate === "string" || item.endDate === null),
    );
  },

  async getEvents(signal?: AbortSignal): Promise<PublicEventsList> {
    const response = await fetch(`${API_URL}/api/public/events`, {
      method: "GET",
      cache: "no-store",
      signal,
    });
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new Error("Events are temporarily unavailable.");
    }
    if (!response.ok || !body || typeof body !== "object" || !("data" in body)) {
      throw new Error("Events are temporarily unavailable.");
    }
    const data = (body as EventsResponse).data;
    if (!data || !Array.isArray(data.upcoming) || !Array.isArray(data.past)) {
      throw new Error("Events response is invalid.");
    }
    return data;
  },

  async getEventDetails(eventId: string, signal?: AbortSignal): Promise<PublicEventDetails> {
    const response = await fetch(`${API_URL}/api/public/events/${encodeURIComponent(eventId)}`, {
      method: "GET",
      cache: "no-store",
      signal,
    });
    if (response.status === 404) throw new PublicEventNotFoundError();
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new Error("Event details are temporarily unavailable.");
    }
    if (!response.ok || !body || typeof body !== "object" || !("data" in body)) {
      throw new Error("Event details are temporarily unavailable.");
    }
    const data = (body as EventDetailsResponse).data;
    if (!data || typeof data.id !== "string" || typeof data.isUpcoming !== "boolean" || !Array.isArray(data.relatedEvents)) {
      throw new Error("Event details response is invalid.");
    }
    return data;
  },

  async getEventGallery(signal?: AbortSignal): Promise<PublicGalleryItem[]> {
    const response = await fetch(`${API_URL}/api/public/gallery`, { method: "GET", cache: "no-store", signal });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || !body || typeof body !== "object" || !("data" in body) || !Array.isArray((body as { data: unknown }).data)) {
      throw new Error("Event gallery is temporarily unavailable.");
    }
    return (body as { data: PublicGalleryItem[] }).data;
  },

  async registerForEvent(eventId: string, input: { name: string; email: string; phone: string; consent: boolean }): Promise<{ eventId: string; eventTitle: string }> {
    const response = await fetch(`${API_URL}/api/public/events/${encodeURIComponent(eventId)}/registrations`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
    });
    const body = await response.json().catch(() => null) as { message?: string; data?: { eventId: string; eventTitle: string } } | null;
    if (!response.ok || !body?.data) throw new Error(body?.message || "Registration could not be completed.");
    return body.data;
  },

  async getNews(signal?: AbortSignal): Promise<PublicNewsArticle[]> {
    const response = await fetch(`${API_URL}/api/public/news`, { method: "GET", cache: "no-store", signal });
    const body = await response.json().catch(() => null) as { data?: unknown } | null;
    if (!response.ok || !Array.isArray(body?.data)) throw new Error("News are temporarily unavailable.");
    return body.data.filter((item): item is PublicNewsArticle => !!item && typeof item === "object" &&
      typeof item.id === "string" && typeof item.slug === "string" && typeof item.title === "string" &&
      (typeof item.summary === "string" || item.summary === null) && typeof item.content === "string" && typeof item.publishedAt === "string");
  },

  async getNewsArticle(slug: string, signal?: AbortSignal): Promise<PublicNewsArticle> {
    const response = await fetch(`${API_URL}/api/public/news/${encodeURIComponent(slug)}`, { method: "GET", cache: "no-store", signal });
    if (response.status === 404) throw new PublicNewsNotFoundError();
    const body = await response.json().catch(() => null) as { data?: unknown } | null;
    const item = body?.data;
    if (!response.ok || !item || typeof item !== "object") {
      throw new Error("Article details are temporarily unavailable.");
    }
    const article = item as Partial<PublicNewsArticle>;
    if (typeof article.id !== "string" || typeof article.slug !== "string" || typeof article.title !== "string" || typeof article.content !== "string" || typeof article.publishedAt !== "string" || (typeof article.summary !== "string" && article.summary !== null)) {
      throw new Error("Article details response is invalid.");
    }
    return article as PublicNewsArticle;
  },
};
