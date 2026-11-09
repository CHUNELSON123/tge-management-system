import type { MemberProgramme } from "../types/member-programmes.types";
import type { MemberEvent, MemberEventDetails } from "../types/member-events.types";

export class MemberLearningEventsRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "MemberLearningEventsRequestError";
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getData<T>(path: string, accessToken: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
    signal,
  });
  const body = await response.json().catch(() => null) as { message?: string; data?: T } | null;
  if (!response.ok || body?.data === undefined) {
    throw new MemberLearningEventsRequestError(body?.message || "Member content could not be loaded.", response.status);
  }
  return body.data;
}

export const memberLearningEventsService = {
  async getProgrammes(accessToken: string, signal?: AbortSignal) {
    const data = await getData<unknown>("/api/member/programmes", accessToken, signal);
    if (!Array.isArray(data)) throw new MemberLearningEventsRequestError("Programme response is invalid.", 502);
    return data.filter((item): item is MemberProgramme => !!item && typeof item === "object" &&
      typeof item.id === "string" && typeof item.name === "string" && typeof item.slug === "string" &&
      (typeof item.description === "string" || item.description === null) &&
      (typeof item.startDate === "string" || item.startDate === null) &&
      (typeof item.endDate === "string" || item.endDate === null) &&
      (typeof item.cohortName === "string" || item.cohortName === null) &&
      (typeof item.enrollmentStatus === "string" || item.enrollmentStatus === null) &&
      (typeof item.enrolledAt === "string" || item.enrolledAt === null));
  },
  async getEvents(accessToken: string, signal?: AbortSignal) {
    const data = await getData<unknown>("/api/member/events", accessToken, signal);
    if (!Array.isArray(data)) throw new MemberLearningEventsRequestError("Event response is invalid.", 502);
    return data.filter((item): item is MemberEvent => !!item && typeof item === "object" &&
      typeof item.id === "string" && typeof item.title === "string" && typeof item.eventType === "string" &&
      (typeof item.description === "string" || item.description === null) && typeof item.startAt === "string" &&
      (typeof item.endAt === "string" || item.endAt === null) &&
      (typeof item.timezone === "string" || item.timezone === null) &&
      (typeof item.venue === "string" || item.venue === null) &&
      (typeof item.registrationStatus === "string" || item.registrationStatus === null) &&
      (typeof item.registeredAt === "string" || item.registeredAt === null));
  },
  async getEventDetails(accessToken: string, eventId: string, signal?: AbortSignal) {
    const item = await getData<unknown>(`/api/member/events/${encodeURIComponent(eventId)}`, accessToken, signal);
    if (!item || typeof item !== "object" || typeof (item as MemberEventDetails).id !== "string" || typeof (item as MemberEventDetails).isUpcoming !== "boolean") {
      throw new MemberLearningEventsRequestError("Event details response is invalid.", 502);
    }
    return item as MemberEventDetails;
  },
};
