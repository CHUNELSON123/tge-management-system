export type MemberEventTab = "upcoming" | "past" | "saved";
export type MemberEventSection = "overview" | "agenda" | "speakers" | "location" | "attendees" | "resources";

export interface MemberEvent {
  id: string;
  title: string;
  eventType: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  timezone: string | null;
  venue: string | null;
  registrationStatus: string | null;
  registeredAt: string | null;
}

export interface MemberEventDetails extends MemberEvent {
  isUpcoming: boolean;
}
