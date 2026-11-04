export interface PublicEventRecord {
  id: string;
  title: string;
  eventType: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  timezone: string | null;
  venue: string | null;
}

export interface PublicEventsRepository {
  listPublishedEvents(): Promise<PublicEventRecord[]>;
  findPublishedEventById(eventId: string): Promise<PublicEventRecord | null>;
  listRelatedPublishedEvents(eventId: string, eventType: string, now: Date, limit: number): Promise<PublicEventRecord[]>;
}

export interface PublicEventsList {
  upcoming: PublicEventRecord[];
  past: PublicEventRecord[];
}

export class GetPublicEventsUseCase {
  constructor(private readonly repository: PublicEventsRepository) {}

  async execute(now = new Date()): Promise<PublicEventsList> {
    const events = await this.repository.listPublishedEvents();
    const upcoming = events
      .filter((event) => new Date(event.startAt).getTime() >= now.getTime())
      .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
    const past = events
      .filter((event) => new Date(event.startAt).getTime() < now.getTime())
      .sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt));
    return { upcoming, past };
  }
}
