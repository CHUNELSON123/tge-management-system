import type { PublicEventRecord, PublicEventsRepository } from "./get-public-events.usecase.js";

export interface PublicEventDetails extends PublicEventRecord {
  isUpcoming: boolean;
  relatedEvents: PublicEventRecord[];
}

export class GetPublicEventDetailsUseCase {
  constructor(private readonly repository: PublicEventsRepository) {}

  async execute(eventId: string, now = new Date()): Promise<PublicEventDetails | null> {
    const event = await this.repository.findPublishedEventById(eventId);
    if (!event) return null;

    const relatedEvents = await this.repository.listRelatedPublishedEvents(event.id, event.eventType, now, 3);
    return { ...event, isUpcoming: Date.parse(event.startAt) >= now.getTime(), relatedEvents };
  }
}
